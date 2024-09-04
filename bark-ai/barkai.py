from gtts import gTTS
from pydub import AudioSegment
import sys
def generate_audio(text, audio_file):
    # Convert text to speech and save as MP3
    print("Generating audio")
    tts = gTTS(text=text, lang='en')
    tts.save(audio_file)
    print(f"Audio saved as {audio_file}")

    # Convert MP3 to WAV
    audio = AudioSegment.from_mp3(audio_file)
    audio.export(audio_file, format='wav')
    print(f"Audio converted to WAV and saved as {audio_file}")

def create_srt(script, audio_file, output_srt):
    print("generating srt")
    audio = AudioSegment.from_wav(audio_file)
    words = script.split()  # Split the script into words
    duration_per_word = len(audio) / len(words)
    
    start_time = 0
    srt_content = ""
    
    for i, word in enumerate(words):
        end_time = start_time + duration_per_word
        start_minutes, start_seconds = divmod(start_time / 1000, 60)
        end_minutes, end_seconds = divmod(end_time / 1000, 60)
        
        srt_content += f"{i+1}\n"
        srt_content += f"{int(start_minutes):02}:{int(start_seconds):02},{int((start_time % 1000) / 10):02d} --> {int(end_minutes):02}:{int(end_seconds):02},{int((end_time % 1000) / 10):02d}\n"
        srt_content += f"{word}\n\n"
        
        start_time = end_time
    
    with open(output_srt, 'w') as file:
        file.write(srt_content)
    print(f"Subtitles saved as {output_srt}")

if __name__ == "__main__":
    # Get text from command line arguments
    text = sys.argv[1]
    audio_file = sys.argv[2]
    output_srt = sys.argv[3]
    
    # Generate audio
    generate_audio(text, audio_file)
    
    # Generate subtitles
    create_srt(text, audio_file, output_srt)
