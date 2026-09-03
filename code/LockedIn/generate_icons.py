import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_brand_icon(size=1024, is_foreground=False, is_round=False):
    # Create base image
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if not is_foreground:
        # Background
        if is_round:
            draw.ellipse([0, 0, size, size], fill=(2, 6, 23, 255))
        else:
            corner_radius = int(size * 0.22)
            draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=(2, 6, 23, 255))

        # Ambient radial glow behind the flame
        glow_size = int(size * 0.7)
        glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        glow_center = (size // 2, int(size * 0.55))
        glow_draw.ellipse(
            [
                glow_center[0] - glow_size // 2,
                glow_center[1] - glow_size // 2,
                glow_center[0] + glow_size // 2,
                glow_center[1] + glow_size // 2,
            ],
            fill=(249, 115, 22, 90)
        )
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(int(size * 0.12)))
        img.paste(Image.alpha_composite(Image.new("RGBA", (size, size), (0, 0, 0, 0)), glow_img), (0, 0), glow_img)

    # Scale factors for flame & lock
    scale = size / 1024.0
    cx = size // 2
    cy = int(size * 0.50) if not is_foreground else int(size * 0.52)

    # 1. Outer Flame (Red-Orange Gradient)
    flame_pts = [
        (cx, cy - int(280 * scale)),
        (cx + int(120 * scale), cy - int(150 * scale)),
        (cx + int(200 * scale), cy - int(20 * scale)),
        (cx + int(220 * scale), cy + int(110 * scale)),
        (cx + int(160 * scale), cy + int(220 * scale)),
        (cx + int(70 * scale), cy + int(270 * scale)),
        (cx, cy + int(280 * scale)),
        (cx - int(70 * scale), cy + int(270 * scale)),
        (cx - int(160 * scale), cy + int(220 * scale)),
        (cx - int(220 * scale), cy + int(110 * scale)),
        (cx - int(200 * scale), cy - int(20 * scale)),
        (cx - int(120 * scale), cy - int(150 * scale)),
    ]
    draw.polygon(flame_pts, fill=(249, 115, 22, 255))

    # 2. Inner Flame Core (Yellow-Amber)
    inner_flame_pts = [
        (cx, cy - int(140 * scale)),
        (cx + int(65 * scale), cy - int(50 * scale)),
        (cx + int(110 * scale), cy + int(60 * scale)),
        (cx + int(75 * scale), cy + int(170 * scale)),
        (cx, cy + int(210 * scale)),
        (cx - int(75 * scale), cy + int(170 * scale)),
        (cx - int(110 * scale), cy + int(60 * scale)),
        (cx - int(65 * scale), cy - int(50 * scale)),
    ]
    draw.polygon(inner_flame_pts, fill=(251, 191, 36, 255))

    # 3. Interlocking Padlock (Bottom-Right overlaying the flame)
    lx = cx + int(60 * scale)
    ly = cy + int(80 * scale)
    lw = int(140 * scale)
    lh = int(120 * scale)

    # Shackle (Arched handle)
    shackle_thick = int(22 * scale)
    shackle_bbox = [lx - lw//2 + int(18*scale), ly - int(95*scale), lx + lw//2 - int(18*scale), ly + int(10*scale)]
    draw.arc(shackle_bbox, start=180, end=360, fill=(254, 215, 170, 255), width=shackle_thick)
    draw.rectangle([shackle_bbox[0], ly - int(45*scale), shackle_bbox[0] + shackle_thick, ly], fill=(254, 215, 170, 255))
    draw.rectangle([shackle_bbox[2] - shackle_thick, ly - int(45*scale), shackle_bbox[2], ly], fill=(254, 215, 170, 255))

    # Lock Body (Dark metallic with bright orange border)
    body_bbox = [lx - lw//2, ly - int(15*scale), lx + lw//2, ly + lh - int(15*scale)]
    draw.rounded_rectangle(body_bbox, radius=int(22*scale), fill=(15, 23, 42, 255), outline=(249, 115, 22, 255), width=int(8*scale))

    # Keyhole
    kh_center = (lx, ly + int(35*scale))
    draw.ellipse([kh_center[0] - int(14*scale), kh_center[1] - int(14*scale), kh_center[0] + int(14*scale), kh_center[1] + int(14*scale)], fill=(251, 191, 36, 255))
    draw.polygon([(kh_center[0] - int(8*scale), kh_center[1]), (kh_center[0] + int(8*scale), kh_center[1]), (kh_center[0] + int(12*scale), kh_center[1] + int(24*scale)), (kh_center[0] - int(12*scale), kh_center[1] + int(24*scale))], fill=(251, 191, 36, 255))

    return img

# Generate PWA & Web Icons
os.makedirs("public", exist_ok=True)
create_brand_icon(192).save("public/icon-192.png")
create_brand_icon(512).save("public/icon-512.png")
create_brand_icon(180).save("public/apple-touch-icon.png")
print("✅ Generated public PWA icons!")

# Android Mipmap Icons
android_res = "android/app/src/main/res"
mipmap_configs = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

for folder, square_size, fg_size in mipmap_configs:
    target_dir = os.path.join(android_res, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    # Standard square icon
    create_brand_icon(square_size).save(os.path.join(target_dir, "ic_launcher.png"))
    
    # Round launcher icon
    create_brand_icon(square_size, is_round=True).save(os.path.join(target_dir, "ic_launcher_round.png"))
    
    # Foreground icon for adaptive launchers
    create_brand_icon(fg_size, is_foreground=True).save(os.path.join(target_dir, "ic_launcher_foreground.png"))
    
    print(f"✅ Generated {folder} ({square_size}px, round, fg: {fg_size}px)")

print("🎉 ALL ICONS GENERATED SUCCESSFULLY!")
