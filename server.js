import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const HF_TOKEN = process.env.HF_TOKEN

app.use(cors())
app.use(express.json())

// ✅ Test route
app.get('/test', (req, res) => {
  res.send('Backend working')
})

// ✅ Image generation route
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body

    console.log("Prompt:", prompt)
    console.log("Token exists:", !!HF_TOKEN)

    if (!prompt || !prompt.trim()) {
      return res.status(400).send('Prompt is empty')
    }

    if (!HF_TOKEN) {
      return res.status(500).send('HF token missing')
    }

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    )

    // ❌ If API error
    if (!response.ok) {
      const text = await response.text()
      console.error("HF ERROR:", text)
      return res.status(400).send(text)
    }

    const contentType = response.headers.get('content-type')

    // ❌ If not image
    if (!contentType || !contentType.includes('image')) {
      const text = await response.text()
      console.error("NOT IMAGE:", text)
      return res.status(400).send(text)
    }

    // ✅ Convert to image
    const buffer = Buffer.from(await response.arrayBuffer())

    res.set('Content-Type', 'image/png')
    res.send(buffer)

  } catch (err) {
    console.error("SERVER ERROR:", err)
    res.status(500).send('Server crashed')
  }
})

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
})