all: assets/image.js flappybird

ifeq ($(shell uname),Darwin)
BASE64 = base64 -i
else
BASE64 = base64 -w 0
endif

assets/image.js: $(wildcard assets/*.png)
	@echo "export default {" > $@
	@for file in $^; do \
		name=$$(basename $$file .png); \
		echo "  '$$name': '$$($(BASE64) $$file)'," >> $@; \
	done
	@echo "};" >> $@

flappybird: assets/image.js
	deno compile --unstable-ffi --env -o flappybird -A main.js

flappybird.exe: assets/image.js
	deno compile --unstable-ffi --target x86_64-pc-windows-msvc -o flappybird.exe --icon assets/icon.ico -A main.js

flappybird_win64.zip: flappybird.exe
	curl -L https://github.com/libsdl-org/SDL_image/releases/download/release-2.8.1/SDL2_image-2.8.1-win32-x64.zip -o SDL2_image-2.8.1-win32-x64.zip
	unzip SDL2_image-2.8.1-win32-x64.zip -d SDL2_image-2.8.1-win32-x64
	curl -L https://github.com/libsdl-org/SDL/releases/download/release-2.28.5/SDL2-2.28.5-win32-x64.zip -o SDL2-2.28.5-win32-x64.zip
	unzip SDL2-2.28.5-win32-x64.zip -d SDL2-2.28.5-win32-x64
	cp SDL2_image-2.8.1-win32-x64/SDL2_image.dll .
	cp SDL2-2.28.5-win32-x64/SDL2.dll .
	zip -r flappybird_win64.zip flappybird.exe SDL2.dll SDL2_image.dll
	rm -rf SDL2_image-2.8.1-win32-x64 SDL2-2.28.5-win32-x64
	rm SDL2_image-2.8.1-win32-x64.zip SDL2-2.28.5-win32-x64.zip

clean:
	rm -f assets/image.js assets/mainfont.js

.PHONY: clean
