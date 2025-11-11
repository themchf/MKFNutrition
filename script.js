// Firebase setup (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyDOoxjTVtST82ebt18MlrXMor0BPE2mQkY",
  authDomain: "mkf-biomatch.firebaseapp.com",
  projectId: "mkf-biomatch",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function analyzeDiet() {
  const input = document.getElementById('dietInput').value.toLowerCase();
  if (!input.trim()) return alert("Please enter your daily diet.");

  let score = 50;
  let positive = 0, negative = 0;

  const goodFoods = ["yogurt", "vegetable", "fruit", "fiber", "water", "nuts", "fish", "chicken", "olive oil", "avocado", "kimchi", "kefir"];
  const badFoods = ["soda", "burger", "fries", "sugar", "chips", "pizza", "candy", "fried", "alcohol", "red meat"];

  goodFoods.forEach(food => { if (input.includes(food)) score += 5; positive++; });
  badFoods.forEach(food => { if (input.includes(food)) score -= 5; negative++; });

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  document.getElementById('result').classList.remove('hidden');
  document.getElementById('score').innerText = `${score}/100`;

  let analysis = score > 70
    ? "Your gut microbiome balance seems healthy. Keep it up!"
    : score > 40
    ? "Moderate gut health. Try balancing your meals with more fiber and probiotic foods."
    : "Your gut health may be poor due to low diversity and high processed foods.";

  document.getElementById('analysis').innerText = analysis;

  const recs = [];
  if (score < 70) recs.push("Add probiotic foods like yogurt or kimchi.");
  if (!input.includes("water")) recs.push("Increase water intake.");
  if (!input.includes("fruit")) recs.push("Eat more fruits and vegetables.");
  if (input.includes("fried")) recs.push("Reduce fried food consumption.");

  const recList = document.getElementById('recommendations');
  recList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');

  // Save minimal data
  db.collection("gutReports").add({
    diet: input,
    score: score,
    timestamp: new Date()
  });
}
