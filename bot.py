"""
🦅 HawkEye Bot — Ultimate Edition
Merged from GodEye + HawkEye
All features, all bugs fixed, one clean bot.
"""

import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, CallbackContext, filters
)

from modules.phone_lookup  import lookup_number, format_display, parse_phone
from modules.vehicle       import search_vehicle
from modules.facebook      import search_phone_facebook
from modules.lawyer        import search_lawyer
from modules.accountant    import search_accountant
from modules.imei          import search_imei
from modules.dog_owner     import search_dog_owner
from modules.image_analysis import handle_photo
from modules.username      import search_username, search_advanced
from modules.alpha         import search_single_name

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "8624339291:AAEMmViP2C7Vzb3qi9vsSHXGOcHFKpkMGKU")

# Track per-user search state
search_active: dict = {}
stop_search:   dict = {}


# ─── MENUS ────────────────────────────────────────────────────────────────────

def main_menu():
    keyboard = [
        [InlineKeyboardButton("🦅 ALPHA — חיפוש מקיף", callback_data="search_alpha")],
        [
            InlineKeyboardButton("📞 זיהוי מספר טלפון",   callback_data="search_phone_id"),
            InlineKeyboardButton("👤 פייסבוק לפי פלאפון", callback_data="search_facebook"),
        ],
        [
            InlineKeyboardButton("🚗 רכב / שלדה",         callback_data="search_vehicle"),
            InlineKeyboardButton("📱 IMEI",               callback_data="search_imei"),
        ],
        [
            InlineKeyboardButton("⚖️ עורך דין",           callback_data="search_lawyer"),
            InlineKeyboardButton("📊 רואה חשבון",         callback_data="search_accountant"),
        ],
        [
            InlineKeyboardButton("🐶 בעל כלב",            callback_data="search_dog"),
            InlineKeyboardButton("🔍 שם משתמש",           callback_data="search_username"),
        ],
        [
            InlineKeyboardButton("🌐 חיפוש רשתי",         callback_data="search_web"),
            InlineKeyboardButton("🖼️ ניתוח תמונה",        callback_data="search_image"),
        ],
        [InlineKeyboardButton("❓ עזרה",                  callback_data="help")],
    ]
    return InlineKeyboardMarkup(keyboard)


def back_button():
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("🏠 תפריט ראשי", callback_data="back_home")
    ]])


# ─── COMMANDS ─────────────────────────────────────────────────────────────────

async def start(update: Update, context: CallbackContext) -> None:
    text = (
        "🦅 *HawkEye — Ultimate Edition*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "בחר פעולה מהתפריט 👇"
    )
    if update.message:
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=main_menu())
    elif update.callback_query:
        await update.callback_query.message.reply_text(text, parse_mode="Markdown", reply_markup=main_menu())


async def stop_cmd(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    stop_search[user_id] = True
    await update.message.reply_text("החיפוש נעצר ⛔️", reply_markup=back_button())


async def help_cmd(update: Update, context: CallbackContext) -> None:
    help_text = (
        "🦅 *HawkEye — מדריך שימוש*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "1️⃣ *זיהוי מספר טלפון* 📞\n"
        "   שלח: `972 544444444` או `+972544444444`\n"
        "   מחזיר שמות מ-GetContact + Truecaller\n\n"
        "2️⃣ *פייסבוק לפי פלאפון* 👤\n"
        "   שלח מספר טלפון — חיפוש במאגר Facebook\n\n"
        "3️⃣ *רכב / שלדה* 🚗\n"
        "   שלח מספר רכב (7-8 ספרות) — data.gov.il\n\n"
        "4️⃣ *IMEI* 📱\n"
        "   שלח 14-15 ספרות — זיהוי מותג ודגם\n\n"
        "5️⃣ *עורך דין* ⚖️\n"
        "   שלח שם — חיפוש במאגר עורכי הדין\n\n"
        "6️⃣ *רואה חשבון* 📊\n"
        "   שלח שם בעברית — data.gov.il\n\n"
        "7️⃣ *בעל כלב* 🐶\n"
        "   שלח שם — חיפוש במאגר משרד החקלאות\n\n"
        "8️⃣ *שם משתמש* 🔍\n"
        "   חיפוש ברשתות חברתיות\n\n"
        "9️⃣ *חיפוש רשתי* 🌐\n"
        "   Webmii + SocialSearcher\n\n"
        "🔟 *ניתוח תמונה* 🖼️\n"
        "   שלח תמונה — AI זיהוי אובייקטים + חיפוש תמונה הפוכה\n\n"
        "🌟 *ALPHA* — חיפוש בכל הקטגוריות בו זמנית\n\n"
        "לעצירת חיפוש: /stop"
    )
    msg = update.message or update.callback_query.message
    await msg.reply_text(help_text, parse_mode="Markdown", reply_markup=back_button())


# ─── BUTTON HANDLER ───────────────────────────────────────────────────────────

async def button(update: Update, context: CallbackContext) -> None:
    query = update.callback_query
    await query.answer()
    data = query.data

    prompts = {
        "search_alpha":      ("single_name",  "🦅 *ALPHA* — שלח שם לחיפוש בכל הקטגוריות"),
        "search_phone_id":   ("phone_id",     "📞 שלח מספר טלפון לזיהוי\nלדוגמה: `972 544444444`"),
        "search_facebook":   ("facebook",     "👤 שלח מספר טלפון לחיפוש בפייסבוק\nלדוגמה: `972544444444`"),
        "search_vehicle":    ("vehicle",      "🚗 שלח מספר רכב או שלדה (7-8 ספרות)"),
        "search_imei":       ("imei",         "📱 שלח מספר IMEI (14-15 ספרות)"),
        "search_lawyer":     ("lawyer",       "⚖️ שלח שם של עורך דין לחיפוש"),
        "search_accountant": ("accountant",   "📊 שלח שם רואה חשבון *בעברית*"),
        "search_dog":        ("dog",          "🐶 שלח שם של בעל כלב לחיפוש"),
        "search_username":   ("username",     "🔍 שלח שם משתמש לחיפוש ברשתות"),
        "search_web":        ("web",          "🌐 שלח שם מלא או חברה לחיפוש כללי"),
        "search_image":      ("image",        "🖼️ שלח תמונה לניתוח AI וחיפוש הפוכה"),
    }

    if data in prompts:
        search_type, prompt_text = prompts[data]
        context.user_data["search_type"] = search_type
        await query.edit_message_text(prompt_text, parse_mode="Markdown")

    elif data == "back_home":
        await start(update, context)

    elif data == "help":
        await help_cmd(update, context)

    elif data == "stop":
        user_id = query.from_user.id
        stop_search[user_id] = True
        await query.edit_message_text("החיפוש נעצר ⛔️")
        await query.message.reply_text(".", reply_markup=back_button())


# ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────

async def handle_message(update: Update, context: CallbackContext) -> None:
    user_id   = update.message.from_user.id
    user_input = update.message.text.strip()
    search_type = context.user_data.get("search_type", "phone_id")

    if search_active.get(user_id):
        await update.message.reply_text("⏳ חיפוש כבר מתבצע, המתן לסיומו.")
        return

    stop_search[user_id]   = False
    search_active[user_id] = True

    try:
        if search_type == "phone_id":
            phone = parse_phone(user_input)
            if not phone:
                await update.message.reply_text(
                    "⚠️ פורמט לא תקין. נסה: `972 544444444`", parse_mode="Markdown"
                )
                return
            display = format_display(phone)
            await update.message.reply_text(f"🦅 מחפש `{display}`...", parse_mode="Markdown")
            result = await lookup_number(phone, display)
            await update.message.reply_text(result, parse_mode="Markdown")

        elif search_type == "facebook":
            await update.message.reply_text("🔍 מחפש בפייסבוק...")
            await search_phone_facebook(user_input, update, context)

        elif search_type == "vehicle":
            await update.message.reply_text("🚗 מחפש רכב...")
            await search_vehicle(user_input, update, context)

        elif search_type == "imei":
            await search_imei(user_input, update, context)

        elif search_type == "lawyer":
            await update.message.reply_text("⚖️ מחפש עורך דין...")
            await search_lawyer(user_input, update, context)

        elif search_type == "accountant":
            await update.message.reply_text("📊 מחפש רואה חשבון...")
            await search_accountant(user_input, update, context)

        elif search_type == "dog":
            await update.message.reply_text("🐶 מחפש בעל כלב...")
            await search_dog_owner(user_input, update, context, stop_search)

        elif search_type == "username":
            await search_username(user_input, update, context)

        elif search_type == "web":
            await search_advanced(user_input, update, context)

        elif search_type == "single_name":
            await search_single_name(user_input, update, context, stop_search)

        else:
            await update.message.reply_text("בחר פעולה מהתפריט תחילה 👇", reply_markup=main_menu())
            return

    except Exception as e:
        logger.error(f"Error in handle_message: {e}")
        await update.message.reply_text("❌ שגיאה במהלך החיפוש. נסה שוב.", reply_markup=back_button())
        return
    finally:
        search_active[user_id] = False

    await update.message.reply_text("🏠 חזרה לתפריט:", reply_markup=back_button())


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stop",  stop_cmd))
    app.add_handler(CommandHandler("help",  help_cmd))
    app.add_handler(CallbackQueryHandler(button))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("🦅 HawkEye Ultimate is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
