import { useState } from "react";
import { mastraClient } from "./../../../lib/mastra";

export default function Test() {
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const city = formData.get("city")?.toString();
    const agent = mastraClient.getAgent("weatherAgent");

    const response = await agent.generate({
      messages: [{ role: "user", content: `What's the weather like in ${city}?` }]
    });

    setResult(response.text);
  }

  return (
    <>
      <h1>Test</h1>
      <form onSubmit={handleSubmit}>
        <input name="city" placeholder="Enter city" required />
        <button type="submit">Get Weather</button>
      </form>
      {result && <pre>{result}</pre>}
    </>
  );
}
