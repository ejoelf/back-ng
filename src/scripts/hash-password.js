import bcrypt from "bcryptjs";

const raw = process.argv[2] || "nico789";

const hash = await bcrypt.hash(raw, 10);

console.log(hash);