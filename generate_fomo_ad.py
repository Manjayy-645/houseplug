from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1080, 1080
flyer = Image.new('RGB', (width, height), color='#1B4332') # Deep Green
draw = ImageDraw.Draw(flyer)

# Fonts
try:
    font_super = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 95)
    font_large = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 75)
    font_medium = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 45)
    font_regular = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 40)
except IOError:
    font_super = font_large = font_medium = font_regular = ImageFont.load_default()

# Background Pattern / Shapes (Dynamic FOMO vibe)
# Amber top angled block
draw.polygon([(0, 0), (1080, 0), (1080, 350), (0, 200)], fill="#F59E0B") 
# Darker green bottom block
draw.polygon([(0, 1080), (1080, 1080), (1080, 950), (0, 850)], fill="#064E3B") 

# Helper for centered text
def draw_centered_text(y_pos, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    x_pos = (width - (bbox[2] - bbox[0])) / 2
    draw.text((x_pos, y_pos), text, font=font, fill=fill)

# Main Heading (On the amber background)
draw_centered_text(40, "STOP PAYING", font_large, "#111827")
draw_centered_text(120, "FULL RENT! 😱", font_super, "#B91C1C") # Intense Red

# FOMO Badge
badge_text = "🔥 SPOTS ARE FILLING UP FAST 🔥"
bbox = draw.textbbox((0, 0), badge_text, font=font_medium)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
bx = (width - tw) / 2
by = 380
# Red pill badge
draw.rounded_rectangle([bx - 30, by - 20, bx + tw + 30, by + th + 20], radius=30, fill="#DC2626", outline="#FCA5A5", width=4)
draw_centered_text(by - 5, badge_text, font_medium, "white")

# Body / Urgency
draw_centered_text(490, "Don't miss out on the best apartments.", font_regular, "white")
draw_centered_text(550, "Match with a verified student today!", font_medium, "#FCD34D")

# QR Code Section
qr_path = "C:/Users/HP/Desktop/NESST/qrcodepic.png"
if os.path.exists(qr_path):
    qr_img = Image.open(qr_path).convert("RGBA")
    qr_size = 260
    qr_img = qr_img.resize((qr_size, qr_size))
    qr_x = (width - qr_size) // 2
    qr_y = 660
    
    # "SCAN ME" pointer text above QR
    draw_centered_text(qr_y - 60, "👇 SCAN NOW BEFORE RESUMPTION 👇", font_medium, "white")
    
    # QR Backdrop (Thick white border with amber outline)
    draw.rounded_rectangle([qr_x - 15, qr_y - 15, qr_x + qr_size + 15, qr_y + qr_size + 15], radius=15, fill="white", outline="#F59E0B", width=6)
    flyer.paste(qr_img, (qr_x, qr_y), qr_img)
else:
    draw_centered_text(750, "[ QR CODE NOT FOUND ]", font_medium, "red")

# Footer Website
draw_centered_text(970, "www.houseplug.ng/roommates", font_large, "white")

# Save
output_path = "C:/Users/HP/Desktop/NESST/roommate_flyer_ad_fomo.png"
flyer.save(output_path)
print(f"FOMO Ad successfully generated at {output_path}")
