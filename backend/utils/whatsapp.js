/**
 * Dummy WhatsApp utility to replace the buggy headless client.
 * The actual messaging will now be handled via frontend wa.me links.
 */

const sendWhatsApp = async (phone, message) => {
    console.log(`[SIMULATED WHATSAPP] To: ${phone} | Msg: ${message}`);
    // No backend puppeteer crashes!
};

module.exports = { sendWhatsApp };
