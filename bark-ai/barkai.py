from gtts import gTTS
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import speech_recognition as sr
import whisper
import os
import subprocess
import requests




import sys

import warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

def download_piper_model(model_name, download_dir):
    """Downloads the required Piper TTS model files to a specified directory if they don't exist."""
    # Ensure the directory exists
    os.makedirs(download_dir, exist_ok=True)

    model_files = [
        (f"{model_name}.onnx", f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/bryce/medium/{model_name}.onnx?download=true"),
        (f"{model_name}.onnx.json", f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/bryce/medium/{model_name}.onnx.json?download=true")
    ]
    
    for filename, url in model_files:
        file_path = os.path.join(download_dir, filename)
        if not os.path.exists(file_path):
            print(f"Downloading {filename} to {download_dir}...")
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=1024):
                        f.write(chunk)
                print(f"{filename} downloaded successfully to {download_dir}.")
            else:
                print(f"Failed to download {filename}. HTTP Status code: {response.status_code}")
        else:
            print(f"{filename} already exists in {download_dir}. Skipping download.")

# def generate_audio_with_piper(text, model_name, output_file, download_dir):
#     """Generates audio from text using Piper TTS and saves it as a WAV file."""
#     print("Downloading Piper model files...")
#     download_piper_model(model_name, download_dir)

#     print("Generating audio with Piper TTS...")
#     try:
#         # Construct the full path to the model file
#         model_path = os.path.join(download_dir, f"{model_name}.onnx")
#         # Run Piper command to generate the audio file
#         command = f'echo "{text}" | piper --model {model_path} --output_file {output_file}'
#         subprocess.run(command, shell=True, check=True)
#         print(f"Audio generated and saved as {output_file}")
#     except subprocess.CalledProcessError as e:
#         print(f"Error generating audio: {e}")


def generate_audio_with_piper(text, model_name, output_file, piper_exe_path, model_dir):
    newText=text
    """Generates audio from text using Piper TTS and saves it as a WAV file."""
    print("Generating audio with Piper TTS...")

    # Construct the full path to the model file
    model_path = os.path.join(model_dir, f"{model_name}.onnx")
    
    # Construct the Piper command using the manually downloaded executable
    command = f'echo "{newText}" | "{piper_exe_path}" --model "{model_path}" --output_file "{output_file}"'
    
    try:
        # Run the Piper command to generate the audio file
        subprocess.run(command, shell=True, check=True)
        print(f"Audio generated and saved as {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Error generating audio: {e}")



def speed_up_audio(input_path, output_path, speed):
    print("speeding up")
    # Load the audio file
    audio = AudioSegment.from_file(input_path)
    
    # Speed up the audio
    sped_up_audio = audio.speedup(playback_speed=speed)
    
    # Export the sped-up audio
    sped_up_audio.export(output_path, format="wav")

def transcribe_word_by_word(audio_file, output_srt_file):
    model = whisper.load_model("base")
    result = model.transcribe(audio_file, word_timestamps=True)  # Enable word timestamps

    # Check if 'segments' and 'words' keys are in the result
    if 'segments' not in result:
        print("No segments found in the transcription result.")
        return

    # Create SRT file from word-by-word transcription
    with open(output_srt_file, 'w') as srt_file:
        word_counter = 1
        for segment in result['segments']:
            # Check if 'words' is in the segment
            if 'words' not in segment:
                continue  # Skip if no words data is present

            for word in segment['words']:
                # Check if 'start', 'end', and 'word' keys exist
                if 'start' in word and 'end' in word and 'word' in word:
                    start_time = word['start']
                    end_time = word['end']
                    text = word['word'].strip()

                    srt_file.write(f"{word_counter}\n")
                    srt_file.write(f"{format_time(start_time)} --> {format_time(end_time)}\n")
                    srt_file.write(f"{text}\n\n")
                    word_counter += 1

def format_time(seconds):
    hrs, seconds = divmod(seconds, 3600)
    mins, seconds = divmod(seconds, 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{int(hrs):02}:{int(mins):02}:{int(seconds):02},{millis:03}"

if __name__ == "__main__":
    if len(sys.argv) != 7:
        print("Usage: python script.py <text> <audio_file> <output_srt>")
        sys.exit(1)

    text = sys.argv[1]
    audio_file = sys.argv[2]
    output_srt = sys.argv[3]
    audio_speed = sys.argv[4]
    piper_exe_path=sys.argv[5]
    model_directory=sys.argv[6]
    speed_factor = 1.15  # Default speed factor
    model_name="en_US-danny-low"

    # Generate audio
    generate_audio_with_piper(text, model_name, audio_file,piper_exe_path,model_directory)
    # generate_audio(text, audio_file)

    # Step 1: Speed up the audio
    # speed_up_audio(audio_file, audio_speed,speed_factor)

    
    # Generate subtitles
    # create_srt(text, audio_file, output_srt, speed_factor)
    transcribe_word_by_word(audio_file, output_srt)


