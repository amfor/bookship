# bookship

A GitHub App to add collaborative commenting to Jupyter Notebooks. 

## How it looks
<img width="1701" alt="image" src="https://github.com/amfor/bookship/assets/19957162/2b76e98a-536c-4fe7-977e-5ca9f6abf95c">

## Getting it working 

```
make venv
make migrations
make server
```

## Caveats

This relies on notebooks having hashes, which only applies to nbformat >=4.5.

VSCode and JupyterLab will spawn nbformat 4.2 notebooks which lack this hashing mechanism. 
