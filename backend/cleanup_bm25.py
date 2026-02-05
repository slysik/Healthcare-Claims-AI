"""One-time script to deduplicate BM25 index."""

import json
from pathlib import Path

index_path = Path("../data/bm25_index.json")
data = json.loads(index_path.read_text())

# Deduplicate chunks by (text, page, doc_name)
seen = set()
unique_chunks = []
for chunk in data["chunks"]:
    key = (chunk["text"], chunk["page"], chunk.get("doc_name", ""))
    if key not in seen:
        seen.add(key)
        unique_chunks.append(chunk)

print(f"Before: {len(data['chunks'])} chunks")
print(f"After:  {len(unique_chunks)} chunks")
print(f"Removed {len(data['chunks']) - len(unique_chunks)} duplicates")

# Write deduplicated index
data["chunks"] = unique_chunks
index_path.write_text(json.dumps(data, indent=2))
print("Saved clean index")
