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

def create_srt(script, audio_file, output_srt, speed_factor):
    print("Generating SRT")
    audio = AudioSegment.from_wav(audio_file)
    words = script.split()  # Split the script into words
    duration_per_word = len(audio) / len(words) / speed_factor  # Adjust duration for speed factor
    
    start_time = 0
    srt_content = ""
    
    for i, word in enumerate(words):
        end_time = start_time + duration_per_word
        start_hours, start_minutes, start_seconds = convert_ms_to_hms(start_time)
        end_hours, end_minutes, end_seconds = convert_ms_to_hms(end_time)
        
        srt_content += f"{i+1}\n"
        srt_content += f"{start_hours}:{start_minutes}:{start_seconds},{int(start_time % 1000):03d} --> {end_hours}:{end_minutes}:{end_seconds},{int(end_time % 1000):03d}\n"
        srt_content += f"{word}\n\n"
        
        start_time = end_time
    
    with open(output_srt, 'w') as file:
        file.write(srt_content)
    print(f"Subtitles saved as {output_srt}")

def convert_ms_to_hms(milliseconds):
    hours = int(milliseconds // 3600000)
    minutes = int((milliseconds % 3600000) // 60000)
    seconds = int((milliseconds % 60000) // 1000)
    return f"{hours:02d}", f"{minutes:02d}", f"{seconds:02d}"

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python script.py <text> <audio_file> <output_srt>")
        sys.exit(1)

    text = sys.argv[1]
    audio_file = sys.argv[2]
    output_srt = sys.argv[3]
    speed_factor = 1.5  # Default speed factor

    # Generate audio
    generate_audio(text, audio_file)
    
    # Generate subtitles
    create_srt(text, audio_file, output_srt, speed_factor)
