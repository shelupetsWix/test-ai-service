import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';


dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8080;
const apiKey = process.env.API_KEY;

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send({ msg: 'index' });
});

app.post('/generateCaption', async (req: Request, res: Response) => {
  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: req.body.config.max_tokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: req.body.prompt },
            {
              type: 'image_url',
              image_url: {
                url: req.body.url,
                detail: req.body.config.detail,
              },
            },
          ],
        },
      ],
    });
    res.send({
      usage: response.usage,
      caption: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching caption');
  }
});

app.post('/generateImage', async (req: Request, res: Response) => {
  const openai = new OpenAI({ apiKey });
  const length = req.body.length || 1;
  const prompt = 'image to blog post about fitness class in Tel Aviv called Jazz yoga'
  try {
    const imageGenerationPromises = Array.from({ length }, () =>
      openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    );

    const responses = await Promise.all(imageGenerationPromises);
    const aggregatedData = responses.flatMap((response) =>
      response.data.map((image) => ({
        url: image.url,
        revised_prompt: image.revised_prompt,
      })),
    );
    res.send({
      created: responses[0].created,
      data: aggregatedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generate Image');
  }
});

app.listen(PORT, () => {
  console.log(`[ADS SERVER] Server is running on port : ${PORT}`);
});
