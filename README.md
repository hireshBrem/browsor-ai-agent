
<h1 align="center">
  <br>
  <img src="./public/logo.png" alt="Browsor Agent Logo" width="100">
  <br>
  Browsor Agent
  <br>
</h1>

<h4 align="center">AI agent that automates any repetitive browser task from screen recordings</h4>

<p align="center">
  <a href="#how-to-use">How To Use</a> •
  <a href="#api-integrations">API Integrations</a> •
  <a href="https://github.com/hireshBrem/browsor-agent/blob/main/LICENSE">License</a>
</p>

<p align="center">
  <img alt="Browsor Agent Demo" src="./public/demo.gif" width="50%"> </img>
</p>

## How To Use

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. You'll also need API keys for the integrated services. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/hireshb/junction-ai-hack

# Go into the repository
$ cd junction-ai-hack

# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env.local
# Add your API keys to .env.local:
# OPENAI_API_KEY=your_openai_api_key_here
# TWELVELABS_API_KEY=your_twelvelabs_api_key_here
# HYPERBROWSER_API_KEY=your_hyperbrowser_api_key_here

# Run the development server
$ npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

> **Note**
> You'll need valid API keys for TwelveLabs, OpenAI, and Hyperbrowser to use the full functionality.


## API Integrations

This application integrates with several powerful AI and automation services:

### 🎥 TwelveLabs
- **Get Started**: Sign up at [TwelveLabs](https://twelvelabs.io/) for your API key

### 🧠 OpenAI
- **Get Started**: Obtain your API key from [OpenAI Platform](https://platform.openai.com/)

### 🌐 Hyperbrowser
- **Get Started**: Sign up at [Hyperbrowser](https://www.hyperbrowser.ai/) for your API key

## Demo

1. **Upload a screen recording** of a workflow you want to automate (or use the [default one](https://github.com/hireshBrem/browsor-agent/blob/main/public/screen-recording/send_email_task.mov))
2. **Add optional context** to guide the AI analysis (for customising the workflow)
3. **Click "Run Agent"** to start the three-stage process:
   - 📹 Video analysis (TwelveLabs)
   - 📝 Step generation (OpenAI GPT-4o)
   - 🤖 Browser automation (Hyperbrowser Agent)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

> GitHub [@hireshb](https://github.com/hireshb) &nbsp;&middot;&nbsp;
> Twitter [@hiresh_b](https://x.com/hiresh_b)
