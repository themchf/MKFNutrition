// === Firebase (optional, for hosting only) ===
const firebaseConfig = {
  apiKey: "AIzaSyDOoxjTVtST82ebt18MlrXMor0BPE2mQkY",
  authDomain: "mkf-biomatch.firebaseapp.com",
  projectId: "mkf-biomatch",
};
firebase.initializeApp(firebaseConfig);

// === TensorFlow.js Model ===
async function trainModel() {
  // Example training data (keywords mapped to healthy or unhealthy patterns)
  const samples = [
    { text: "yogurt vegetables fruits fiber water", score: 90 },
    { text: "burger fries soda pizza chips", score: 20 },
    { text: "chicken rice salad olive oil", score: 80 },
    { text: "red meat alcohol sugar candy", score: 35 },
    { text: "fish brown rice avocado nuts water", score: 85 },
    { text: "fried food soda fast food", score: 25 },
    { text: "smoothie oats fruit vegetables", score: 95 },
    { text: "ice cream pasta white bread", score: 40 }
  ];

  // Convert text into word frequency vectors
  const vocab = Array.from(new Set(samples.flatMap(s => s.text.split(" "))));
  const wordIndex = {};
  vocab.forEach((w, i) => (wordIndex[w] = i));

  const xs = tf.tensor2d(samples.map(s => textToVector(s.text, wordIndex)));
  const ys = tf.tensor2d(samples.map(s => [s.score / 100]));

  // Small neural net
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [vocab.length], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({ optimizer: "adam", loss: "meanSquaredError" });

  await model.fit(xs, ys, { epochs: 60, shuffle: true });
  return { model, wordIndex };
}

function textToVector(text, wordIndex) {
  const vec = Array(Object.keys(wordIndex).length).fill(0);
  text.split(" ").forEach(w => {
    if (wordIndex[w] !== undefined) vec[wordIndex[w]] = 1;
  });
  return vec;
}

// === Analysis ===
async function analyzeDiet() {
  const input = document.getElementById('dietInput').value.toLowerCase().trim();
  if (!input) return alert("Please describe your daily eating routine.");

  // Load TensorFlow
  if (!window.tf) {
    alert("TensorFlow.js is loading, please try again in a few seconds.");
    return;
  }

  // Train lightweight model
  const { model, wordIndex } = await trainModel();

  // Predict score
  const inputVector = tf.tensor2d([textToVector(input, wordIndex)]);
  const prediction = model.predict(inputVector);
  const rawScore = (await prediction.data())[0];
  const score = Math.round(rawScore * 100);

  // Interpret results
  let analysis = "";
  if (score >= 75) analysis = "Excellent microbiome balance. Your diet promotes healthy gut flora!";
  else if (score >= 50) analysis = "Moderate gut health. Try including more fiber and probiotic foods.";
  else analysis = "Low gut health potential due to processed or sugary foods.";

  const recs = [];
  if (score < 75) recs.push("Add fermented foods like yogurt, kimchi, or kefir.");
  if (!input.includes("water")) recs.push("Drink more water daily for digestion.");
  if (!input.includes("fruit") && !input.includes("vegetable")) recs.push("Eat more fruits and vegetables.");
  if (input.includes("fried") || input.includes("soda")) recs.push("Reduce fried and sugary items.");

  // Display results
  document.getElementById('resultCard').classList.remove('hidden');
  document.getElementById('score').innerHTML =
    `<span class='result-flag flag-${score >= 75 ? "normal" : score >= 50 ? "low" : "high"}'>${score}/100</span>`;
  document.getElementById('analysis').textContent = analysis;
  document.getElementById('recommendations').innerHTML = recs.length
    ? recs.map(r => `• ${r}`).join("<br>")
    : "Keep your current routine — it's balanced!";

  // Clean up tensors
  tf.dispose([prediction, inputVector]);
}
