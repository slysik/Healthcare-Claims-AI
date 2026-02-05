"""Dual-engine RAG: BM25 (default) or ChromaDB (optional)."""

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path

logger = logging.getLogger(__name__)


class BaseRetriever(ABC):
    """Abstract retriever interface."""

    @abstractmethod
    def ingest_pdf(self, path: str | Path, doc_name: str | None = None) -> int:
        """Ingest PDF. Returns chunk count."""
        ...

    @abstractmethod
    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search for relevant chunks. Returns list with keys: text, page, score, doc_name."""
        ...

    @abstractmethod
    def list_documents(self) -> list[str]:
        """List ingested document names."""
        ...

    @abstractmethod
    def is_ready(self) -> bool:
        """Has at least one document been ingested?"""
        ...

    @abstractmethod
    def document_count(self) -> int:
        """Number of ingested documents."""
        ...


def _extract_pdf_text(path: str | Path) -> list[dict]:
    """Extract text from PDF using PyMuPDF. Returns list of {text, page}."""
    import fitz  # PyMuPDF

    doc = fitz.open(str(path))
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            pages.append({"text": text.strip(), "page": page_num + 1})
    doc.close()
    return pages


def _chunk_text(pages: list[dict], chunk_size: int = 500, overlap: int = 100) -> list[dict]:
    """Split page text into overlapping chunks with page metadata."""
    chunks = []
    for page_data in pages:
        text = page_data["text"]
        page = page_data["page"]

        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            if chunk_text.strip():
                chunks.append({
                    "text": chunk_text.strip(),
                    "page": page,
                })
            start += chunk_size - overlap

    return chunks


class BM25Retriever(BaseRetriever):
    """BM25-based retriever using rank-bm25 (pure Python, no model downloads)."""

    def __init__(self):
        from rank_bm25 import BM25Okapi

        self.chunks: list[dict] = []
        self.doc_names: set[str] = set()
        self.bm25: BM25Okapi | None = None
        self.tokenized_corpus: list[list[str]] = []

        # Try to load existing index
        from app.config import settings
        self.index_path = Path(settings.DATA_DIR) / "bm25_index.json"
        self._load_index()

    _STOP_WORDS = frozenset({
        "a", "an", "the", "is", "are", "was", "were", "be",
        "been", "being", "have", "has", "had", "do", "does",
        "did", "will", "would", "could", "should", "may",
        "might", "can", "shall", "to", "of", "in", "for",
        "on", "with", "at", "by", "from", "as", "into",
        "through", "during", "before", "after", "above",
        "below", "between", "under", "this", "that", "these",
        "those", "it", "its", "my", "your", "our", "their",
        "i", "you", "he", "she", "we", "they", "me", "him",
        "her", "us", "them", "what", "which", "who", "whom",
        "how", "where", "when", "why", "not", "no", "nor",
        "and", "but", "or", "if", "then", "so", "than",
    })

    def _tokenize(self, text: str) -> list[str]:
        """Lowercase tokenization with stop word removal."""
        tokens = text.lower().split()
        return [t for t in tokens if t not in self._STOP_WORDS]

    def _save_index(self):
        """Persist chunks to disk."""
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "chunks": self.chunks,
            "doc_names": list(self.doc_names)
        }
        self.index_path.write_text(json.dumps(data, indent=2))
        logger.info(f"Saved BM25 index to {self.index_path}")

    def _load_index(self):
        """Load chunks from disk if available."""
        if not self.index_path.exists():
            return

        try:
            data = json.loads(self.index_path.read_text())
            self.chunks = data.get("chunks", [])
            self.doc_names = set(data.get("doc_names", []))

            if self.chunks:
                self._rebuild_bm25_index()
                chunk_count = len(self.chunks)
                doc_count = len(self.doc_names)
                logger.info(
                    f"Loaded BM25 index with {chunk_count} chunks from {doc_count} documents"
                )
        except Exception as e:
            logger.warning(f"Failed to load BM25 index: {e}")

    def _rebuild_bm25_index(self):
        """Rebuild BM25 index from current chunks."""
        from rank_bm25 import BM25Okapi

        self.tokenized_corpus = [self._tokenize(chunk["text"]) for chunk in self.chunks]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

    def ingest_pdf(self, path: str | Path, doc_name: str | None = None) -> int:
        """Ingest PDF. Returns chunk count."""
        if doc_name is None:
            doc_name = Path(path).stem

        logger.info(f"Ingesting PDF: {path} as {doc_name}")

        # Extract and chunk
        pages = _extract_pdf_text(path)
        new_chunks = _chunk_text(pages)

        # Add doc_name to each chunk
        for chunk in new_chunks:
            chunk["doc_name"] = doc_name

        # Append to corpus
        self.chunks.extend(new_chunks)
        self.doc_names.add(doc_name)

        # Rebuild index
        self._rebuild_bm25_index()

        # Persist
        self._save_index()

        logger.info(f"Ingested {len(new_chunks)} chunks from {doc_name}")
        return len(new_chunks)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search for relevant chunks. Returns list with keys: text, page, score, doc_name."""
        if self.bm25 is None or not self.chunks:
            return []

        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)

        # Get top_k indices
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in top_indices:
            chunk = self.chunks[idx]
            results.append({
                "text": chunk["text"],
                "page": chunk["page"],
                "score": float(scores[idx]),
                "doc_name": chunk.get("doc_name", "unknown")
            })

        return results

    def list_documents(self) -> list[str]:
        """List ingested document names."""
        return sorted(list(self.doc_names))

    def is_ready(self) -> bool:
        """Has at least one document been ingested?"""
        return len(self.chunks) > 0

    def document_count(self) -> int:
        """Number of ingested documents."""
        return len(self.doc_names)


class ChromaRetriever(BaseRetriever):
    """ChromaDB-based retriever with fastembed support."""

    def __init__(self):
        try:
            import chromadb
        except ImportError:
            raise RuntimeError(
                "ChromaDB not installed. Install with: pip install '.[chroma]'"
            )

        from app.config import settings
        chroma_path = Path(settings.DATA_DIR) / "chroma"
        chroma_path.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(path=str(chroma_path))
        self.collection = self.client.get_or_create_collection(
            name="bcbs_documents",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Initialized ChromaDB at {chroma_path}")

    def ingest_pdf(self, path: str | Path, doc_name: str | None = None) -> int:
        """Ingest PDF. Returns chunk count."""
        if doc_name is None:
            doc_name = Path(path).stem

        logger.info(f"Ingesting PDF into ChromaDB: {path} as {doc_name}")

        # Extract and chunk
        pages = _extract_pdf_text(path)
        chunks = _chunk_text(pages)

        # Prepare for ChromaDB
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [
            {
                "page": chunk["page"],
                "doc_name": doc_name
            }
            for chunk in chunks
        ]
        ids = [f"{doc_name}_chunk_{i}" for i in range(len(chunks))]

        # Add to collection
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

        logger.info(f"Ingested {len(chunks)} chunks from {doc_name} into ChromaDB")
        return len(chunks)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search for relevant chunks. Returns list with keys: text, page, score, doc_name."""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        if not results["documents"] or not results["documents"][0]:
            return []

        formatted_results = []
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i] if results.get("distances") else 0.0

            formatted_results.append({
                "text": doc,
                "page": metadata.get("page", 0),
                "score": 1.0 - distance,  # Convert distance to similarity score
                "doc_name": metadata.get("doc_name", "unknown")
            })

        return formatted_results

    def list_documents(self) -> list[str]:
        """List ingested document names."""
        # Get all unique doc_names from collection metadata
        all_items = self.collection.get()
        if not all_items["metadatas"]:
            return []

        doc_names = set()
        for metadata in all_items["metadatas"]:
            doc_name = metadata.get("doc_name")
            if doc_name:
                doc_names.add(doc_name)

        return sorted(list(doc_names))

    def is_ready(self) -> bool:
        """Has at least one document been ingested?"""
        return self.collection.count() > 0

    def document_count(self) -> int:
        """Number of ingested documents."""
        return len(self.list_documents())


class RetrieverManager:
    """Factory that creates the right retriever based on config."""

    def __init__(self):
        self._retriever: BaseRetriever | None = None

    def get_retriever(self) -> BaseRetriever:
        if self._retriever is None:
            from app.config import settings
            if settings.RAG_ENGINE == "chroma":
                self._retriever = ChromaRetriever()
            else:
                self._retriever = BM25Retriever()
            logger.info(f"Initialized RAG engine: {settings.RAG_ENGINE}")
        return self._retriever

    # Delegate common methods
    def ingest_pdf(self, path, doc_name=None):
        return self.get_retriever().ingest_pdf(path, doc_name)

    def search(self, query, top_k=5):
        return self.get_retriever().search(query, top_k)

    def list_documents(self):
        return self.get_retriever().list_documents()

    def is_ready(self):
        return self.get_retriever().is_ready()

    def document_count(self):
        return self.get_retriever().document_count()

    def engine_name(self) -> str:
        from app.config import settings
        return settings.RAG_ENGINE


retriever_manager = RetrieverManager()
