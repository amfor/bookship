# Makefile for creating a Python virtual environment

# Name of the virtual environment directory
VENV_NAME := venv

# Python interpreter (modify as needed)
PYTHON := python3

# Targets
.PHONY: venv clean

venv: $(VENV_NAME)/bin/activate

$(VENV_NAME)/bin/activate: 
	$(PYTHON) -m venv $(VENV_NAME)
	@source $(VENV_NAME)/bin/activate && pip install --upgrade pip && pip install poetry && poetry install

clean:
	rm -rf $(VENV_NAME)

migrations:
	$(VENV_NAME)/bin/python ./bookship/manage.py makemigrations bookship 
	$(VENV_NAME)/bin/python ./bookship/manage.py migrate 

server:
	$(VENV_NAME)/bin/python ./bookship/manage.py runserver
