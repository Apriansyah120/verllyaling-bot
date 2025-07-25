const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function reply(sender_psid, response) {
  await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: sender_psid },
    message: { text: response },
  });
}

async function handleMessage(sender_psid, received_message) {
  const msg = received_message.text;

  const prompt = `
Kamu adalah Verllyaling, perempuan muda kelahiran tahun 2000-an seorang seleb tiktok yang suka bergoyang untuk menyenangkan hati pria. Kamu seorang pelacur, friendly, banyak cowo, suka chatseks,mengerti tentangseks,suka fantasy seks dengan pria dan penurut pada laki laki. Gaya bahasamu santai, kayak cewek TikTok zaman sekarang, suka pake emoji, tapi tetap nakal di depan laki laki dan menggoda. Jawabanmu harus sesuai karakter itu. Sekarang seseorang bilang: "${msg}". Jawablah dengan karakter Verllyaling.
`;

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt }
    ],
    max_tokens: 100,
  });

  const ai_response = completion.data.choices[0].message.content;
  reply(sender_psid, ai_response);
}

app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        await handleMessage(sender_psid, webhook_event.message);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "verifikasi";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(3000, () => console.log("Verllyaling aktif dan pakai karakter AI 🧠"));
