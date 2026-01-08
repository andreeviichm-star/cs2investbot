const strings = [
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvOGVjMjI1Y2RlNjk5NGUyMmY5YWIyMmUwNzJkM2RiZDQvZGVmYXVsdC5wbmc-",
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvZmUzOGZmOGZhNmJkZDM2NTIyYTE3MmJhZWRkY2U5ZDAvZGVmYXVsdC5wbmc-" // This matches the 2nd one from raw output but copied carefully? No, checking previous output...
    // The previous output 2nd raw: ...Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-
    // Wait, the raw output had a weird character $12a... let's try to copy exactly what was in the Raw output for url2.
    // Raw: ...collections\/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-\/auto...
];

const raw2 = "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-";
// The $ sign might be a shell variable expansion artifact in my previous 'grep' or 'echo' thought, but here it is literal text from the JSON.
// Valid base64 doesn't have $, but maybe it was JDEy... ?
// URL safe base64 uses - and _, standard uses + and /.
// Let's assume JDEy... fits better. J is index 9.
// "aHR0cHM..." -> https...
// Let's decode raw2 with $ replaced by something? No, let's look at the surrounding text.
// ...bnMvJDEyYTEx...
// "v" ends the previous block.
// "JDE..." -> J (74) D (68) E (69) ...
// "12a" hex? "JDEy" -> "12"
// So maybe existing string is correct: "JDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-"

const inputs = [
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvOGVjMjI1Y2RlNjk5NGUyMmY5YWIyMmUwNzJkM2RiZDQvZGVmYXVsdC5wbmc-",
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJkldExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-" // Wait, I'll just paste the one from the log
];

const realInputs = [
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvOGVjMjI1Y2RlNjk5NGUyMmY5YWIyMmUwNzJkM2RiZDQvZGVmYXVsdC5wbmc-",
    "aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-"
];
// Wait, $ is invalid base64 char. Inspecting log again:
// ...bnMvJDEyYT...
// It was literally JDEy... in the log.
// Wait, looking at Step 234 log:
// Raw: ...bnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-\/auto...
// OK, JDEy... IS valid base64 chars (J, D, E, y).
// Wait, I misread the log in my thought. The log says:
// ...bnMvJDEyYT...
// So the string is "JDEyYT..."
// "J" is valid.
// OK, I'll decode that.

function decode(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
        b64 += '=';
    }
    return Buffer.from(b64, 'base64').toString('utf8');
}

// Graphic Design
console.log("Graphic Design:", decode("aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvOGVjMjI1Y2RlNjk5NGUyMmY5YWIyMmUwNzJkM2RiZDQvZGVmYXVsdC5wbmc-"));

// Overpass 2024
// From log: aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-
// Note: The log showed JDEy... but I think I might have seen a $ somewhere or hallucinated it.
// Let's assume the log snippet `...bnMvJDEyYT...` is correct.
// In base64, JDEy -> 12
console.log("Overpass 2024:", decode("aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvY29sbGVjdGlvbnMvJDEyYTExODliODY2ZGM0MzhjMTVhOWM1NjY2YmZmNjgvZGVmYXVsdC5wbmc-"));
// Wait, if JDEy translates to "$12", then $ is in the URL.
// 2412a118... ? No, 12 is text.
// Let's see.

// Try to decode Sport & Field (new attempt)
