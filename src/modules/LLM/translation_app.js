// import { FoundryLocalManager } from "foundry-local-sdk";
// import { ChatOpenAI } from "@langchain/openai";
// import { ChatPromptTemplate } from "@langchain/core/prompts";

// // By using an alias, the most suitable model will be downloaded 
// // to your end-user's device.
// // TIP: You can find a list of available models by running the 
// // following command in your terminal: `foundry model list`.
// const alias = "qwen2.5-0.5b";

// // Create a FoundryLocalManager instance. This will start the Foundry 
// // Local service if it is not already running.
// const foundryLocalManager = new FoundryLocalManager()

// // Initialize the manager with a model. This will download the model 
// // if it is not already present on the user's device.
// const modelInfo = await foundryLocalManager.init(alias)
// console.log("Model Info:", modelInfo)

// // Configure ChatOpenAI to use your locally-running model
// const llm = new ChatOpenAI({
//     model: modelInfo.id,
//     configuration: {
//         baseURL: foundryLocalManager.endpoint,
//         apiKey: foundryLocalManager.apiKey
//     },
//     temperature: 0.6,
//     streaming: false
// });

// // Create a translation prompt template
// const prompt = ChatPromptTemplate.fromMessages([
//     {
//         role: "system",
//         content: "You are a helpful assistant that translates {input_language} to {output_language} and summarizes the content."
//     },
//     {
//         role: "user",
//         content: "{input}"
//     }
// ]);

// // Build a simple chain by connecting the prompt to the language model
// const chain = prompt.pipe(llm);

// const input = "I am passionate about creating high-performance web applications using modern technologies such as ReactJS, Node.js, and MongoDB. Through building real-world projects like Spotify Clone, I developed a solid foundation in both frontend and back-end development. My goal is to contribute to a forward-thinking company by delivering reliable software solutions and continuously improving user experiences.";
// console.log(`Translating '${input}' to Vietnamese...`);

// // Run the chain with your inputs
// chain.invoke({
//     input_language: "English",
//     output_language: "Vietnamese",
//     input: input
// }).then(aiMsg => {
//     // Print the result content
//     console.log(`Response: ${aiMsg.content}`);
// }).catch(err => {
//     console.error("Error:", err);
// });