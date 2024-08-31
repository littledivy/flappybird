all: assets/image.js flappybird

assets/image.js: $(wildcard assets/*.png)
	@echo "export default {" > $@
	@for file in $^; do \
		name=$$(basename $$file .png); \
		echo "  '$$name': '$$(base64 -w 0 $$file)'," >> $@; \
	done
	@echo "};" >> $@

flappybird: assets/image.js
	deno compile --unstable-ffi -o flappybird -A main.js

flappybird.exe: assets/image.js
	deno compile --unstable-ffi --target x86_64-pc-windows-msvc -o flappybird.exe --icon assets/icon.ico -A main.js

clean:
	rm -f assets/image.js assets/mainfont.js

.PHONY: clean
