const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const apiKey = "AIzaSyAjck0dJEtpdQGU0PenVrKEJfDyz0AyesI";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello');
    console.log('Success!', result.response.text());
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
