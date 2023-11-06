import os
import os.path
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
                if os.path.isdir(result_path) and 'html' in result_path:
                    self.template_paths.append(result_path)
            
            self.template_paths.append(os.path.join(os.path.dirname(__file__), "templates"))

    def _template_file_default(self):
        """
        We want to use the new template we ship with our library.
        """
        return "test_template.tpl"  # full        
    



    def from_notebook_node(  # type:ignore[explicit-override, override]
        self, nb: NotebookNode, resources: Optional[Dict[str, Any]] = None, **kw: Any
    ) -> Tuple[str, Dict[str, Any]]:
        
        def add_comment_buttons(soup:BeautifulSoup):
            classname = "highlight hl-ipython3"
            div_elements = soup.find_all("div", class_=classname)
            for div_element in div_elements:
                pre_element = div_element.find('pre')
                startlen, endlen = len('<pre><span></span>'), -len('</pre>')
                buttonstr = '<button class="add-line-comment">+</button>'
                editorstr = '<textarea id="markdownEditor" style="display: none;"></textarea>'
                
                lines = str(pre_element)[startlen:endlen-2].split('\n')
                commentable_cell_contents = '<pre><span></span>'  + "\n".join([buttonstr + _ + editorstr if len(_) > 1 else _ for _ in lines]) + '</pre>'    
                pre_element.replace_with(BeautifulSoup(commentable_cell_contents, 'html.parser').pre)
                        
        """Convert from notebook node."""
        langinfo = nb.metadata.get("language_info", {})
        lexer = langinfo.get("pygments_lexer", langinfo.get("name", None))
        highlight_code = self.filters.get(
            "highlight_code", Highlight2HTML(pygments_lexer=lexer, parent=self)
        )

        filter_data_type = WidgetsDataTypeFilter(
            notebook_metadata=self._nb_metadata, parent=self, resources=resources
        )

        self.register_filter("highlight_code", highlight_code)
        self.register_filter("filter_data_type", filter_data_type)
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

        add_comment_buttons(soup)

        return str(soup), resources
    
   
            