

def split_newlines(val):
    return tuple(enumerate(val.split('\n')))


from bs4 import BeautifulSoup

def strip_outer_div(val):
    soup = BeautifulSoup(val, 'html.parser')
    return''.join(map(str, soup.style.contents))