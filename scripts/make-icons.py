"""Draw the app icons. Original artwork, no third-party assets."""

import struct
import zlib
from pathlib import Path


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def png(size: int, pixel) -> bytes:
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y, size))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(
        b"IDAT", zlib.compress(bytes(raw), 9)
    ) + chunk(b"IEND", b"")


def icon(x: int, y: int, size: int) -> tuple[int, int, int, int]:
    nx = (x + 0.5) / size * 2 - 1
    ny = (y + 0.5) / size * 2 - 1
    green = (14, 107, 82, 255)
    cream = (244, 239, 230, 255)
    petal = (216, 87, 74, 255)
    if abs(nx) < 0.045 and -0.05 < ny < 0.72:
        return cream
    if 0.02 < nx < 0.42 and 0.05 < ny < 0.42 and (ny - 0.08) < (0.42 - nx) * 0.7:
        return cream
    petals = ((-0.18, -0.22, 0.22), (0.18, -0.22, 0.22), (0.0, -0.42, 0.2))
    for px, py, radius in petals:
        if (nx - px) ** 2 + (ny - py) ** 2 < radius ** 2:
            return cream if py < -0.3 else petal
    return green


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "public"
    for size in (192, 512):
        (root / f"icon-{size}.png").write_bytes(png(size, icon))


if __name__ == "__main__":
    main()
