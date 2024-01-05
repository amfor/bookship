import os
import os.path
from pathlib import Path
import importlib
from nbconvert import HTMLExporter
# -----------------------------------------------------------------------------
# Classes
# -----------------------------------------------------------------------------

from typing import Any, Dict, Optional, Tuple
from nbconvert.filters.highlight import Highlight2HTML
from nbconvert.filters.markdown_mistune import IPythonRenderer, MarkdownWithMath
from nbconvert.filters.widgetsdatatypefilter import WidgetsDataTypeFilter
from bs4 import BeautifulSoup

from nbformat import NotebookNode

from traitlets.utils.importstring import import_item
import markupsafe

import hashlib
import json
parent_dir = Path(__file__).parent
import sys
sys.path.append(str(parent_dir))
from filters import split_newlines, strip_outer_div


def load_code(folder_name="javascript", ext=".js", concatenate=False):

    all_contents = list()
    for file in os.listdir(str(parent_dir / folder_name)):
        if ext in file:
            js_path  =  str(parent_dir / f"{folder_name}/{file}")
            with open(js_path, 'r') as f:
                contents = f.read()
            all_contents.append(contents)
    
    if concatenate:
        return "\n".join(all_contents)
    return all_contents

class MyExporter(HTMLExporter):
    """
    My custom exporter
    """

    # If this custom exporter should add an entry to the
    # "File -> Download as" menu in the notebook, give it a name here in the
    # `export_from_notebook` class member
    export_from_notebook = "My format"

    def __init__(self, *args, **kwargs):
            # Initialize the parent class
            super(MyExporter, self).__init__(*args, **kwargs)
            
            base_template_path = importlib.util.find_spec('nbconvert').submodule_search_locations[0]
            for result in os.listdir(base_template_path):
                result_path = os.path.join(base_template_path, result)
                if os.path.isdir(result_path) and 'lab' in result_path:
                    self.template_paths.append(result_path)
                    for deep_path in os.listdir(result_path):
                        if os.path.isdir(deep_path) and 'lab' in result_path:
                            self.template_paths.append(deep_path)
            
            self.template_paths.append(os.path.join(os.path.dirname(__file__), "templates"))

    def _template_file_default(self):
        """
        We want to use the new template we ship with our library.
        """
        return "review.tpl"  # full        
    

    def from_notebook_node(  # type:ignore[explicit-override, override]
        self, nb: NotebookNode, resources: Optional[Dict[str, Any]] = dict(), **kw: Any
    ) -> Tuple[str, Dict[str, Any]]:

        """Convert from notebook node."""
        langinfo = nb.metadata.get("language_info", {})
        lexer = langinfo.get("pygments_lexer", langinfo.get("name", None))
        highlight_code = self.filters.get(
            "highlight_code", Highlight2HTML(pygments_lexer=lexer, parent=self)
        )

        filter_data_type = WidgetsDataTypeFilter(
            notebook_metadata=self._nb_metadata, parent=self, resources=resources
        )

        self.register_filter("strip_outer_div", strip_outer_div)
        self.register_filter("split_newlines", split_newlines)
        self.register_filter("highlight_code", highlight_code)
        self.register_filter("filter_data_type", filter_data_type)
        
        resources['notebook_sha256'] = hashlib.sha256(json.dumps(nb, sort_keys=True).encode()).hexdigest()
        resources['footer_js'] = load_code("javascript", ext=".js")
        resources['cells_css'] = load_code("css", ext=".css")
        html, resources = super().from_notebook_node(nb, resources, **kw)
        soup = BeautifulSoup(html, features="html.parser")
        # Add image's alternative text
        missing_alt = 0
        for elem in soup.select("img:not([alt])"):
            elem.attrs["alt"] = "No description has been provided for this image"
            missing_alt += 1
        if missing_alt:
            self.log.warning(f"Alternative text is missing on {missing_alt} image(s).")
        # Set input and output focusable
        for elem in soup.select(".jp-Notebook div.jp-Cell-inputWrapper"):
            elem.attrs["tabindex"] = "0"
        for elem in soup.select(".jp-Notebook div.jp-OutputArea-output"):
            elem.attrs["tabindex"] = "0"


        return str(soup), resources
    
   
            