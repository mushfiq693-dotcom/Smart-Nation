"""
CivicSphere AI & ClimAct Twin — Engine 04:
In-Process Policy Document Retriever (BM25 / Keyword Hybrid Chunking).

Indexes official guidelines in docs/policy_corpus/ with sub-5ms latency
and attaches structured citation payloads for Copilot and Policy Briefs.
"""

import math
import re
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.core.config import settings

POLICY_DIR = Path(settings.POLICY_CORPUS_DIR)


class PolicyChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_slug: str,
        doc_title: str,
        section_title: str,
        content: str,
        filepath: str,
    ):
        self.chunk_id = chunk_id
        self.doc_slug = doc_slug
        self.doc_title = doc_title
        self.section_title = section_title
        self.content = content
        self.filepath = filepath
        self.tokens = self._tokenize(content + " " + section_title + " " + doc_title)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 2]

    def to_citation(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_slug": self.doc_slug,
            "document_title": self.doc_title,
            "section": self.section_title,
            "excerpt": self.content[:240] + ("..." if len(self.content) > 240 else ""),
            "source_path": self.filepath,
            "provenance_class": "Official_Policy_Guideline",
        }


class PolicyRetriever:
    def __init__(self):
        self.corpus_dir = POLICY_DIR
        self.chunks: List[PolicyChunk] = []
        self.avg_doc_len = 0.0
        self.idf: Dict[str, float] = {}
        self.k1 = 1.5
        self.b = 0.75
        self._build_index()

    def _build_index(self):
        self.chunks = []
        if not self.corpus_dir.exists():
            return

        md_files = sorted(list(self.corpus_dir.glob("*.md")))
        for fpath in md_files:
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    text = f.read()

                # Extract Document Title from first H1
                doc_title = fpath.stem.replace("_", " ").title()
                h1_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
                if h1_match:
                    doc_title = h1_match.group(1).strip()

                # Split by ## sections
                sections = re.split(r"\n(?=##\s+)", text)
                for idx, sec in enumerate(sections):
                    sec_clean = sec.strip()
                    if not sec_clean:
                        continue

                    # Extract section title
                    sec_title = f"Section {idx+1}"
                    h2_match = re.search(r"^##\s+(.+)$", sec_clean, re.MULTILINE)
                    if h2_match:
                        sec_title = h2_match.group(1).strip()

                    chunk_id = f"{fpath.stem}_sec_{idx}"
                    chunk = PolicyChunk(
                        chunk_id=chunk_id,
                        doc_slug=fpath.stem,
                        doc_title=doc_title,
                        section_title=sec_title,
                        content=sec_clean,
                        filepath=str(fpath.name),
                    )
                    self.chunks.append(chunk)
            except Exception as e:
                print(f"[Policy Indexer Warning] Could not parse {fpath}: {e}")

        # Compute IDF
        total_docs = len(self.chunks)
        if total_docs == 0:
            return

        doc_lengths = [len(c.tokens) for c in self.chunks]
        self.avg_doc_len = sum(doc_lengths) / total_docs

        df_counts: Dict[str, int] = {}
        for c in self.chunks:
            unique_tokens = set(c.tokens)
            for t in unique_tokens:
                df_counts[t] = df_counts.get(t, 0) + 1

        self.idf = {}
        for t, df in df_counts.items():
            self.idf[t] = math.log(1.0 + (total_docs - df + 0.5) / (df + 0.5))

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Executes in-process BM25 scoring over indexed policy sections.
        Returns top_k chunks with content and citation metadata in < 5ms.
        """
        start = time.perf_counter()
        if not self.chunks:
            self._build_index()

        q_tokens = PolicyChunk._tokenize(query)
        if not q_tokens or not self.chunks:
            return []

        scores: List[tuple] = []
        for chunk in self.chunks:
            score = 0.0
            doc_len = len(chunk.tokens)
            term_freqs: Dict[str, int] = {}
            for t in chunk.tokens:
                term_freqs[t] = term_freqs.get(t, 0) + 1

            for qt in q_tokens:
                if qt in term_freqs:
                    tf = term_freqs[qt]
                    idf = self.idf.get(qt, 0.5)
                    # BM25 formula
                    numerator = tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / (self.avg_doc_len or 1.0)))
                    score += idf * (numerator / max(0.001, denominator))

            if score > 0.0:
                scores.append((score, chunk))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_matches = scores[:top_k]
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        results = []
        for score, chunk in top_matches:
            entry = chunk.to_citation()
            entry["bm25_score"] = round(score, 3)
            entry["full_section_content"] = chunk.content
            entry["retrieval_latency_ms"] = round(elapsed_ms, 2)
            results.append(entry)

        return results


# Global singleton
policy_retriever = PolicyRetriever()
