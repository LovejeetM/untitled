import skia
# No longer need 'requests' or 'io' for local files
import textwrap

def generate_slide_with_skia(output_path: str, width: int, height: int):
    """
    Generates the slide by directly drawing all elements using Skia.
    """
    # --- 1. Define Design System (Colors, Fonts, Sizes) ---
    class Theme:
        BG_COLOR = skia.Color(5, 5, 21)
        CYAN = skia.Color(0, 198, 255)
        PURPLE = skia.Color(150, 0, 255)
        LIGHT_GRAY = skia.Color(176, 184, 196)
        WHITE_TRANSPARENT = skia.ColorSetARGB(int(0.2 * 255), 255, 255, 255)
        BORDER_COLOR = skia.ColorSetARGB(int(0.3 * 255), 50, 150, 255)
        PADDING_X, PADDING_Y = 80, 60
        BORDER_RADIUS = 20
        BORDER_WIDTH = 2
        COLUMN_GAP = 60

    # Slide Content
    title_text = "Project Architecture"
    bullet_points = [
        "User requests hit a secure API gateway.",
        "A job queue manages incoming tasks.",
        "Worker nodes use Skia for media.",
        "Assets are stored in a cloud bucket."
    ]
    # This is now a local file path
    local_image_path = "demo1.png"

    # --- 2. Setup Canvas and Fonts ---
    surface = skia.Surface(width, height)
    with surface as canvas:
        paint = skia.Paint(AntiAlias=True)
        title_font = skia.Font(skia.Typeface('Arial', skia.FontStyle.Bold()), 110)
        body_font = skia.Font(skia.Typeface('Arial'), 52)
        bullet_font = skia.Font(skia.Typeface('Arial', skia.FontStyle.Bold()), 52)

        # --- 3. Draw Background & Gradients ---
        canvas.drawColor(Theme.BG_COLOR)
        # (Gradients code is correct and unchanged)
        paint.setShader(skia.GradientShader.MakeLinear(
            points=[(0, 0), (width, height)],
            colors=[
                skia.ColorSetARGB(int(0.1*255), 0, 198, 255), skia.ColorTRANSPARENT,
                skia.ColorTRANSPARENT, skia.ColorSetARGB(int(0.1*255), 150, 0, 255)
            ],
            positions=[0, 0.25, 0.75, 1.0], mode=skia.TileMode.kClamp
        ))
        canvas.drawPaint(paint)
        paint.setShader(skia.GradientShader.MakeRadial(
            center=(width * 0.1, height * 0.1), radius=width * 0.4,
            colors=[skia.ColorSetARGB(int(0.15*255), 0, 198, 255), skia.ColorTRANSPARENT],
            positions=[0, 1.0]
        ))
        canvas.drawPaint(paint)
        paint.setShader(skia.GradientShader.MakeRadial(
            center=(width * 0.9, height * 0.8), radius=width * 0.4,
            colors=[skia.ColorSetARGB(int(0.15*255), 100, 0, 255), skia.ColorTRANSPARENT],
            positions=[0, 1.0]
        ))
        canvas.drawPaint(paint)
        paint = skia.Paint(AntiAlias=True)

        # --- The rest of the function remains the same ---
        content_rect = skia.Rect.MakeLTRB(
            Theme.PADDING_X, Theme.PADDING_Y,
            width - Theme.PADDING_X, height - Theme.PADDING_Y
        )
        canvas.save()
        canvas.translate(content_rect.left(), content_rect.top())
        paint.setColor(Theme.CYAN)
        canvas.drawString(title_text, 0, title_font.getSize(), title_font, paint)
        title_underline_y = title_font.getSize() + 50
        paint.setColor(Theme.WHITE_TRANSPARENT)
        paint.setStrokeWidth(2)
        canvas.drawLine(0, title_underline_y, content_rect.width(), title_underline_y, paint)
        content_area_y_start = title_underline_y + 70
        col_width = (content_rect.width() - Theme.COLUMN_GAP) / 2
        y_cursor = content_area_y_start
        wrapper = textwrap.TextWrapper(width=35)
        for text in bullet_points:
            paint.setColor(Theme.CYAN)
            canvas.drawString("»", 0, y_cursor, bullet_font, paint)
            wrapped_lines = wrapper.wrap(text)
            paint.setColor(Theme.LIGHT_GRAY)
            for i, line in enumerate(wrapped_lines):
                line_y = y_cursor + (i * body_font.getSize() * 1.1)
                canvas.drawString(line, 70, line_y, body_font, paint)
            y_cursor += (len(wrapped_lines) * body_font.getSize() * 1.1) + 60

        # --- FIX: Read the local file correctly ---
        try:
            # Read the file in binary mode ('rb')
            with open(local_image_path, 'rb') as f:
                image_data = skia.Data.MakeWithoutCopy(f.read())
            
            image = skia.Image.MakeFromEncoded(image_data)
            if image is None: # Check if Skia could decode the image
                raise ValueError("Could not decode image data.")

            # (Layout calculation code is correct and unchanged)
            img_col_rect = skia.Rect.MakeXYWH(col_width + Theme.COLUMN_GAP, content_area_y_start, col_width, content_rect.height() - content_area_y_start)
            aspect_ratio_img = image.width() / image.height()
            aspect_ratio_col = img_col_rect.width() / img_col_rect.height()
            if aspect_ratio_img > aspect_ratio_col:
                final_w = img_col_rect.width()
                final_h = final_w / aspect_ratio_img
            else:
                final_h = img_col_rect.height()
                final_w = final_h * aspect_ratio_img
            final_x = img_col_rect.left() + (img_col_rect.width() - final_w) / 2
            final_y = img_col_rect.top() + (img_col_rect.height() - final_h) / 2
            dest_rect = skia.Rect.MakeXYWH(final_x, final_y, final_w, final_h)
            canvas.drawImageRect(image, dest_rect, skia.SamplingOptions(), paint)

        # Catch file-related errors
        except (FileNotFoundError, ValueError) as e:
            print(f"❌ Error loading image '{local_image_path}': {e}")

        canvas.restore()
        paint.setStyle(skia.Paint.kStroke_Style)
        paint.setStrokeWidth(Theme.BORDER_WIDTH)
        paint.setColor(Theme.BORDER_COLOR)
        canvas.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeWH(width, height), Theme.BORDER_RADIUS, Theme.BORDER_RADIUS), paint)

    image = surface.makeImageSnapshot()
    image.save(output_path, skia.kPNG)
    print(f"✅ Skia slide successfully generated and saved to {output_path}")

# --- Main execution ---
if __name__ == "__main__":
    generate_slide_with_skia(
        output_path='./slide_from_skia.png',
        width=2400,
        height=1350
    )