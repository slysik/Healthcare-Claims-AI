"""Test BM25 retrieval after deduplication."""

from app.services.vectorstore import BM25Retriever

retriever = BM25Retriever()
print(f"Chunks: {len(retriever.chunks)}")
print(f"Documents: {retriever.list_documents()}")

queries = [
    "What is the deductible?",
    "Is telehealth covered?",
    "What is the copay for specialist visits?",
    "What does the plan cover for mental health?",
]
for q in queries:
    results = retriever.search(q, top_k=3)
    print(f"\n--- {q} ---")
    for i, r in enumerate(results):
        print(f"  [{i + 1}] score={r['score']:.2f} page={r['page']} doc={r['doc_name']}")
        print(f"      {r['text'][:150]}...")
