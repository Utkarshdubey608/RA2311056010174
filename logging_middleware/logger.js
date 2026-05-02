import axios from "axios";

export async function Log(stack, level, pkg, message) {
  try {
    const TOKEN = process.env.TOKEN; 

    if (!TOKEN) {
      console.log("No token provided for logging");
      return;
    }

    const res = await axios.post(
      "http://20.207.122.201/evaluation-service/logs",
      {
        stack,
        level,
        package: pkg,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    console.log("Log sent:", res.data);

  } catch (err) {
    console.log("Logging failed:", err.response?.data || err.message);
  }
}