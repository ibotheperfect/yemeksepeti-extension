all: clean
	zip -r joker_bekcisi.zip img js manifest.json popup.html

clean:
	rm -f joker_bekcisi.zip
