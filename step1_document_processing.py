"""
=============================================================
STEP 1: DOCUMENT PROCESSING LAYER
=============================================================
What this does:
  - Loads the HR policy text file from disk
  - Splits it into overlapping chunks of ~500 words each
  - Overlap ensures context is not lost at chunk boundaries

Why chunking?
  LLMs have a limited context window. Instead of feeding the
  entire policy doc (which could be huge), we chunk it and
  only retrieve the relevant pieces for each query.

Run: python step1_document_processing.py
"""

def load_document(filepath: str) -> str:
    """Read the raw text file from disk."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"[✓] Loaded document: {filepath}")
    print(f"    Total characters : {len(content)}")
    print(f"    Total words      : {len(content.split())}\n")
    return content


def split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """
    Split text into overlapping word-based chunks.

    Args:
        text       : Full document text
        chunk_size : Number of words per chunk
        overlap    : Number of words shared between consecutive chunks

    Returns:
        List of chunk strings
    """
    words  = text.split()
    chunks = []
    start  = 0

    while start < len(words):
        end        = min(start + chunk_size, len(words))
        chunk_text = " ".join(words[start:end])
        chunks.append(chunk_text)
        if end == len(words):
            break
        start += chunk_size - overlap   # slide forward, keeping 'overlap' words

    return chunks


# ── Run this step ──────────────────────────────────────────
if __name__ == "__main__":
    POLICY_FILE = "leave_policy.txt"          # must be in the same folder

    # 1. Load
    raw_text = load_document(POLICY_FILE)

    # 2. Chunk
    chunks = split_into_chunks(raw_text, chunk_size=500, overlap=100)

    # 3. Inspect results
    print(f"[✓] Chunking complete")
    print(f"    chunk_size = 500 words,  overlap = 100 words")
    print(f"    Total chunks created : {len(chunks)}\n")

    for i, chunk in enumerate(chunks):
        word_count = len(chunk.split())
        preview    = chunk[:120].replace("\n", " ")
        print(f"  Chunk {i+1:02d} | {word_count:3d} words | {preview}...")

    print("\n[Step 1 complete] → chunks ready for embedding in Step 2")
