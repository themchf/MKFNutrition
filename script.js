const form = document.getElementById("bioForm");
const output = document.getElementById("output");

// Load last session (if exists)
window.addEventListener("load", () => {
  const saved = localStorage.getItem("biomatch_last");
  if (saved) {
    const data = JSON.parse(saved);
    document.getElementById("diet").value = data.diet;
    document.getElementById("lifestyle").value = data.lifestyle;
    document.getElementById("sleep").value = data.sleep;
    document.getElementById("goal").value = data.goal;
  }
});

// Simple AI model (TensorFlow.js)
async function analyzeGutHealth(inputs) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [3], units: 5, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });

  const xs = tf.tensor2d([[0,0,6],[1,1,7],[2,2,8],[1,0,5]]);
  const ys = tf.tensor2d([[0.3],[0.8],[0.9],[0.5]]);
  await model.fit(xs, ys, { epochs: 15 });

  const prediction = model.predict(tf.tensor2d([inputs], [1,3]));
  const score = (await prediction.data())[0];
  return score;
}

// Recommend based on score
function getRecommendations(score, goal) {
  const foods = {
    mood: ["Dark chocolate 🍫", "Bananas 🍌", "Fermented yogurt 🥛", "Nuts 🥜"],
    immunity: ["Garlic 🧄", "Ginger 🫚", "Kefir 🥤", "Sauerkraut 🥬"],
    digestion: ["Kimchi 🥬", "Oats 🌾", "Kombucha 🍹", "Leafy greens 🥦"]
  };

  if (score > 0.75) return `✅ Excellent gut health! Maintain with: ${foods[goal].join(", ")}.`;
  if (score > 0.45) return `⚠️ Fair gut balance. Add more of: ${foods[goal].join(", ")}.`;
  return `🚨 Gut imbalance detected. Prioritize: ${foods[goal].join(", ")} daily.`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const diet = document.getElementById("diet").value;
  const lifestyle = document.getElementById("lifestyle").value;
  const sleep = parseFloat(document.getElementById("sleep").value);
  const goal = document.getElementById("goal").value;

  // Convert to numerical values
  const dietNum = diet === "vegan" ? 0 : diet === "vegetarian" ? 1 : 2;
  const lifeNum = lifestyle === "sedentary" ? 0 : lifestyle === "moderate" ? 1 : 2;

  output.classList.remove("hidden");
  output.innerHTML = "<p>🔄 Analyzing your gut health...</p>";

  const score = await analyzeGutHealth([dietNum, lifeNum, sleep]);
  const result = getRecommendations(score, goal);

  output.innerHTML = `
    <h3>Your Gut Health Score: ${(score * 100).toFixed(1)}%</h3>
    <p>${result}</p>
  `;

  // Save session locally
  localStorage.setItem("biomatch_last", JSON.stringify({ diet, lifestyle, sleep, goal }));
});
