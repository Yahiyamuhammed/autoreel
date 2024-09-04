from gtts import gTTS
import sys

# Get text from command line arguments
text = sys.argv[1]
print(text)
output_file = sys.argv[2]


# Convert text to speech
tts = gTTS(text=text, lang='en')
tts.save(output_file)
print(f"Audio saved as {output_file}")
