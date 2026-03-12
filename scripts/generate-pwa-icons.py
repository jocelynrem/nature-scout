import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def hex_to_rgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


BG_TOP = hex_to_rgb('#2b8553')
BG_BOTTOM = hex_to_rgb('#1d7346')
COMPASS = hex_to_rgb('#fff9df')
ACCENT = hex_to_rgb('#f3c857')


def clamp(value, low, high):
    return max(low, min(high, value))


def mix(a, b, t):
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))


def point_in_polygon(x, y, points):
    inside = False
    j = len(points) - 1
    for i in range(len(points)):
      xi, yi = points[i]
      xj, yj = points[j]
      intersects = ((yi > y) != (yj > y)) and (
          x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi
      )
      if intersects:
          inside = not inside
      j = i
    return inside


def write_png(path, width, height, rgba_bytes):
    def chunk(tag, data):
        return (
            struct.pack('!I', len(data))
            + tag
            + data
            + struct.pack('!I', zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(rgba_bytes[start : start + stride])

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(
        chunk(
            b'IHDR',
            struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0),
        )
    )
    png.extend(chunk(b'IDAT', zlib.compress(bytes(raw), level=9)))
    png.extend(chunk(b'IEND', b''))
    path.write_bytes(png)


def draw_icon(size):
    radius = size * 0.28
    compass_radius = size * 0.265
    ring_width = max(3.0, size * 0.045)
    center = size / 2
    cx = center
    cy = center

    outer_diamond = [
        (cx, size * 0.17),
        (size * 0.60, cy),
        (cx, size * 0.83),
        (size * 0.40, cy),
    ]
    inner_diamond = [
        (cx, size * 0.27),
        (size * 0.56, cy),
        (cx, size * 0.73),
        (size * 0.44, cy),
    ]

    pixels = bytearray(size * size * 4)

    for y in range(size):
        for x in range(size):
            index = (y * size + x) * 4
            px = x + 0.5
            py = y + 0.5

            dist_corner_x = min(px, size - px)
            dist_corner_y = min(py, size - py)
            if dist_corner_x < radius and dist_corner_y < radius:
                dx = dist_corner_x - radius
                dy = dist_corner_y - radius
                if dx * dx + dy * dy > radius * radius:
                    pixels[index : index + 4] = b'\x00\x00\x00\x00'
                    continue

            t = y / max(size - 1, 1)
            color = list(mix(BG_TOP, BG_BOTTOM, t))
            alpha = 255

            dx = px - cx
            dy = py - cy
            distance = math.hypot(dx, dy)

            if compass_radius - ring_width <= distance <= compass_radius:
                color = list(COMPASS)

            if point_in_polygon(px, py, outer_diamond):
                color = list(COMPASS)

            if point_in_polygon(px, py, inner_diamond):
                color = list(ACCENT)

            if distance <= size * 0.055:
                color = list(COMPASS)

            pixels[index : index + 4] = bytes(color + [alpha])

    return pixels


def main():
    icons = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'apple-touch-icon.png': 180,
    }
    for name, size in icons.items():
        write_png(ROOT / name, size, size, draw_icon(size))


if __name__ == '__main__':
    main()
