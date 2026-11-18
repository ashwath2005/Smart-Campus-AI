"""
Centralized serialization and deserialization helpers for audit log metadata_json.

Ensures all newly written audit metadata is valid JSON while keeping historical
plain-text, NULL, empty, double-serialized, and malformed records safely readable
without crashing API consumers.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

AuditMetadataValue = Union[Dict[str, Any], List[Any]]


def serialize_audit_metadata(
    metadata: Optional[Union[Dict[str, Any], List[Any], str]] = None,
    *,
    remarks: Optional[str] = None,
) -> Optional[str]:
    """
    Serialize audit metadata or plain-text remarks into a canonical JSON string.

    - Returns None for None, empty strings, or empty containers.
    - Avoids double-wrapping strings that are already valid JSON objects/arrays.
    - Wraps plain-text remarks into {"remarks": "<text>"}.
    """
    if metadata is None and remarks is not None:
        cleaned = remarks.strip()
        if not cleaned:
            return None
        if cleaned[0] in ("{", "["):
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, (dict, list)):
                    return json.dumps(parsed, ensure_ascii=False) if parsed else None
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
        return json.dumps({"remarks": cleaned}, ensure_ascii=False)

    if metadata is None:
        return None

    if isinstance(metadata, (dict, list)):
        return json.dumps(metadata, ensure_ascii=False) if metadata else None

    if isinstance(metadata, str):
        cleaned = metadata.strip()
        if not cleaned:
            return None
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, (dict, list)):
                return json.dumps(parsed, ensure_ascii=False) if parsed else None
            if isinstance(parsed, str):
                inner_cleaned = parsed.strip()
                if not inner_cleaned:
                    return None
                if inner_cleaned[0] in ("{", "["):
                    try:
                        inner_parsed = json.loads(inner_cleaned)
                        if isinstance(inner_parsed, (dict, list)):
                            return json.dumps(inner_parsed, ensure_ascii=False) if inner_parsed else None
                    except (json.JSONDecodeError, TypeError, ValueError):
                        pass
                return json.dumps({"remarks": inner_cleaned}, ensure_ascii=False)
            if parsed is None:
                return None
            return json.dumps({"value": parsed}, ensure_ascii=False)
        except (json.JSONDecodeError, TypeError, ValueError):
            return json.dumps({"remarks": cleaned}, ensure_ascii=False)

    return json.dumps({"value": metadata}, ensure_ascii=False)


def parse_audit_metadata(
    raw_metadata: Optional[Union[str, Dict[str, Any], List[Any]]],
) -> AuditMetadataValue:
    """
    Safely parse stored audit metadata_json into a structured JSON object or array.

    - NULL / empty / whitespace -> {}
    - Valid JSON object or array -> parsed dict or list
    - JSON-encoded scalar string -> unwrapped dict/list if nested JSON, else {"remarks": str}
    - Plain-text legacy value -> {"remarks": raw, "legacy": True}
    - Malformed JSON (starts with '{' or '[' but invalid syntax) -> logs warning and
      returns {"raw": raw, "legacy": True, "malformed": True}
    """
    if raw_metadata is None:
        return {}

    if isinstance(raw_metadata, dict):
        return dict(raw_metadata)

    if isinstance(raw_metadata, list):
        return list(raw_metadata)

    if not isinstance(raw_metadata, str):
        return {"value": raw_metadata}

    stripped = raw_metadata.strip()
    if not stripped:
        return {}

    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, (dict, list)):
            return parsed
        if isinstance(parsed, str):
            inner_stripped = parsed.strip()
            if not inner_stripped:
                return {}
            if inner_stripped[0] in ("{", "["):
                try:
                    inner_parsed = json.loads(inner_stripped)
                    if isinstance(inner_parsed, (dict, list)):
                        return inner_parsed
                except (json.JSONDecodeError, TypeError, ValueError):
                    logger.warning(
                        "Malformed nested JSON in gate pass audit metadata (length=%d)",
                        len(raw_metadata),
                    )
                    return {"raw": raw_metadata, "legacy": True, "malformed": True}
            return {"remarks": parsed}
        if parsed is None:
            return {}
        return {"value": parsed}
    except (json.JSONDecodeError, TypeError, ValueError):
        if stripped[0] in ("{", "["):
            logger.warning(
                "Malformed JSON in gate pass audit metadata (length=%d)",
                len(raw_metadata),
            )
            return {"raw": raw_metadata, "legacy": True, "malformed": True}
        return {"remarks": raw_metadata, "legacy": True}
