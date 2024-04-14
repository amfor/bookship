function getCSRFToken() {
  return fetch("/get_csrf_token")
    .then((response) => response.json())
    .then((data) => data.csrfToken);
}

function isIterable(obj) {
  // Check if the object has a Symbol.iterator property or method
  return obj != null && typeof obj[Symbol.iterator] === "function";
}

function getUserHandle() {
  return "saml_author";
}

function getNotebookHash() {
  let notebookHash = document
    .getElementsByClassName("jp-Notebook")[0]
    .getAttribute("data-nb-sha256");
  return notebookHash;
}

function dtToLocal(dtzString) {
  let dateObject = new Date(dtzString);
  let estDateString = dateObject.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
  });
  return estDateString;
}

function getCellPrecedence() {
  let cells = Object.values(document.getElementsByClassName("jp-Cell"));
  let cellIds = cells.map((element) => element.id.split("=")[1]);
  const cellOrders = Object.fromEntries(
    cellIds.map((value, index) => [value, index + 1])
  );
  return cellOrders;
}

function sortComments() {
  /* Order Comment Threads according to Content Ordering*/
  let bubblesArray = Array.from(
    annotationDiv.querySelectorAll(".commentThreadBubble")
  );
  bubblesArray.sort((a, b) => {
    const cellOrderA = parseInt(a.getAttribute("data-cell-order"), 10);
    const cellOrderB = parseInt(b.getAttribute("data-cell-order"), 10);

    if (cellOrderA === cellOrderB) {
      const lineNoA = a.getAttribute("data-line-no");
      const lineNoB = b.getAttribute("data-line-no");

      const weights = {
        markdown: -1,
        outputs: Infinity,
      };

      const getEffectiveWeight = (lineNo) => {
        if (weights.hasOwnProperty(lineNo)) {
          return weights[lineNo];
        } else {
          return parseInt(lineNo, 10);
        }
      };

      const orderA = getEffectiveWeight(lineNoA);
      const orderB = getEffectiveWeight(lineNoB);

      return orderA - orderB;
    }

    // 'data-cell-order' attributes are not the same, sort by these
    return cellOrderA - cellOrderB;
  });

  bubblesArray.forEach((bubble) => {
    annotationCol.appendChild(bubble);
  });
}

function resetBubblePosition(event) {
  if (selectedBubble && !selectedBubble.contains(event.target)) {
    selectedBubble.style.transform = "scale(1)";
    selectedBubble.style.marginLeft = "0";
    selectedBubble.style.filter = null;

    let commentContainer = selectedBubble.querySelector(
      ".commentInputContainer"
    );
    commentContainer.style.display = "none";
    toggleBubbleCode(selectedBubble.id, (on = false));
    selectedBubble.classList.remove("selectedBubble-transformed")
    selectedBubble = null;
  } 
}

function toggleBubbleCode(threadId, on = true) {
  /* 
    This function highlights the thread's associated content
  */
  let threadBubble = document.getElementById(threadId);
  threadBubble.classList.add("selectedBubble-transformed");

  let threadCodeId = `code-${threadBubble.dataset["cellHash"]}_${threadBubble.dataset["lineNo"]}`;
  let threadCodeElement = document.getElementById(threadCodeId);
  var highlightClassName;
  var contentContainer;
  if (document.getElementById(threadCodeId) === undefined) {
    return;
  } else if (threadBubble.dataset["lineNo"] == "markdown") {
    contentContainer = threadCodeElement
      .closest(".jp-MarkdownCell")
      .querySelector(".jp-MarkdownOutput");
    highlightClassName = "outputHighlights";
  } else if (threadBubble.dataset["lineNo"] == "outputs") {
    contentContainer = threadCodeElement
      .closest(".jp-OutputArea-child")
      .querySelector(".jp-OutputArea-output");
    highlightClassName = "outputHighlights";
  } else {
    contentContainer = threadCodeElement.querySelector("pre");
    contentContainer.style.flex = "auto";
    highlightClassName = "codeHighlight";
  }

  if (on) {
    contentContainer.classList.add(highlightClassName);
  } else {
    contentContainer.classList.remove(highlightClassName);
  }
}

function handleThreadClick(event) {
  resetBubblePosition(event);
  let bubbleElement = event.target.closest(".commentThreadBubble");
  selectedBubble = bubbleElement; // change selected bubble
  selectedBubble.classList.remove("commentThreadBubbleHidden");
  console.log(selectedBubble);
  selectedBubble.style.transform = "scale(1.1)";
  selectedBubble.style.marginLeft = "-10px";
  selectedBubble.style.boxShadow =
    "0 1px 3px rgba(0, 0, 0, .3), 0 4px 8px 3px rgba(0, 0, 0, .15)";

  /* Show input on Bubble Selection */
  let commentContainer = selectedBubble.querySelector(".commentInputContainer");
  commentContainer.style.display = "flex";
  bubbleElement.classList.toggle('active')
  toggleBubbleCode(selectedBubble.id, (on = true));

  if (event.target != this) {
    console.log("DEBUG:You clicked a descendant of #container.");
  } else {
    console.log("DEBUG:You actually clicked #container itself.");
  }
}

function renderCommentContainer(data, showComment = false) {
  var blockStyle;
  if (showComment) {
    blockStyle = "flex";
  } else {
    blockStyle = "none";
  }

  let commentTemplate = `
    <div class="flex-container commentContainer">
    <div class="flex-container commentAuthorMetadata">
        <div class="flex-child">
            <img src="https://avatars.githubusercontent.com/u/19957162?v=4" class="authorAvatar">
        </div>
        <div class="flex-child metadataBox">
            <div class="flex-child">
                <div class="flex-child">
                @${data.author} (${data.fullName})
                </div>
                <div class="flex-child commentMiniHeader">
                ${data.datetime}
                </div>
            </div>
        </div>
    </div>
    <div class="commentContents" style="display: ${blockStyle};">
    ${data.contents}
    </div>
    </div>`;

  return commentTemplate;
}

function templatizeCommentThread(data, newThread = false) {
  var htmlTemplate;
  let firstObject;
  if (isIterable(data)) {
    let renderedCommentContainers = data
      .map((elementData) => renderCommentContainer(elementData, true))
      .join("");
    firstObject = data[0];
    htmlTemplate = `
    <div class="commentThreadHeader flex-container">
    <div class="flex-child">
        ${firstObject.line_no}
    </div>    
    <div class="flex-child">
        ${firstObject.cell_hash}
    </div>
    <div class="flex-child">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
    </div>
    <div class="flex-child">
    <svg xmlns="http://www.w3.org/2000/svg" class="resolveThread" onclick="resolveThread(this);event.stopPropagation()" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
    </div>
    </div> 
        ${renderedCommentContainers}
    </div>`;
  } else {
    firstObject = data;
    htmlTemplate = `
        <div class="commentThreadHeader flex-container">
        <div class="flex-child">
            ${firstObject.line_no}
        </div>    
        <div class="flex-child">
            ${firstObject.cell_hash}
        </div>
        <div class="flex-child">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
        </div>
        <div class="flex-child">
        <svg xmlns="http://www.w3.org/2000/svg" class="resolveThread" onclick="resolveThread(this);event.stopPropagation()" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
        </div>
        </div>
        </div> 
            ${renderCommentContainer(firstObject, false)}
        </div> 
        `;
  }

  if (newThread) {
    commentInputStyle = "flex";
  } else {
    commentInputStyle = "none";
  }
  commentBox = `
  <form class='flex-container commentInputContainer' style="display:${commentInputStyle};"> 
    <textarea type="text" id="input-${firstObject.thread_id}" class="commentInput" placeholder="Commenting as ..."></textarea><br><br>
    <div class="flex-child textInputButtons">
        <input type="button" class="flex-child pill-button submitButton" onclick="submitComment(this);event.stopPropagation()" value="Submit">
        <input type="button" class="flex-child pill-button" onclick="resetBubblePosition(this);event.stopPropagation()" value="Cancel">
    </div>
  </form>
  `;
  var div = document.createElement("div");
  div.classList.add("flex-container", "commentThreadBubble");
  div.innerHTML = htmlTemplate + commentBox;
  div.id = firstObject.thread_id;

  if (firstObject.resolved) {
    div.classList.add("commentThreadBubbleHidden");
  }

  div.setAttribute("data-thread-id", `${firstObject.thread_id}`);
  div.setAttribute("data-cell-hash", `${firstObject.cell_hash}`);
  div.setAttribute("data-cell-order", `${cellOrders[firstObject.cell_hash]}`);
  div.setAttribute("data-line-no", `${firstObject.line_no}`);

  return div;
}

function renderCommentThread(data, newThread = false) {
  var htmlTemplate;
  let firstObject;
  if (isIterable(data)) {
    firstObject = data[0];
  } else {
    firstObject = data;
  }
  div = templatizeCommentThread((data = data), (newThread = newThread));
  let commentInput = div.querySelector(".commentInput");
  commentInput.addEventListener("input", function () {
    this.style.height = "auto";
    const minHeight =
      this.scrollHeight > this.clientHeight
        ? this.scrollHeight
        : this.clientHeight;
    this.style.height = minHeight + "px";
  });

  // Output the generated HTML
  annotationDiv.appendChild(div);

  $(`#${firstObject.thread_id}`).on("click", "*", handleThreadClick);
}

function annotateContent(event) {
  /** 
        This function creates a commentBubble which is ready to accept user input
        for a particular add-comment-button
    
    **/
  const clickedButton = event;

  let cellHash = clickedButton["id"].split("-")[1].split("_")[0];
  let lineNo = clickedButton["id"].split("-")[1].split("_")[1];
  let threadId = `thread-${cellHash}_${lineNo}`;

  /* if thread exists already, just select it! */
  var potentiallyExistingThread = document.getElementById(threadId);
  if (potentiallyExistingThread) {
    selectedBubble = potentiallyExistingThread;
    potentiallyExistingThread.querySelector(".commentThreadHeader").click();
    potentiallyExistingThread.classList.remove("commentThreadBubbleHidden");
    return;
  } else {
    let formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const data = {
      thread_id: threadId /* todo: reduce reduncancy */,
      file_hash: getNotebookHash(),
      cell_hash: cellHash,
      line_no: lineNo,
      statusIcon: "🔵",
      author: "employeeHandle",
      fullName: "Full Name",
      datetime: formattedDate,
      comment: "Placeholder",
    };

    renderCommentThread(data, true);
    sortComments();
    selectedBubble = document.getElementById(threadId);
  }
}

function closeThread(element) {
  let threadBubble = element.closest(".commentThreadBubble");
  let commentInput = threadBubble.closest(".commentInput");
}

function submitComment(element) {
  threadBubble = element.closest(".commentThreadBubble");
  let threadId = threadBubble.getAttribute("data-thread-id");
  let commentContents = threadBubble.querySelector("textarea").value;
  let cellHash = threadBubble.getAttribute("data-cell-hash");
  let lineNo = threadBubble.getAttribute("data-line-no");
  const post_data = {
    thread_id: threadId,
    cell_hash: cellHash,
    line_no: lineNo,
    file_hash: getNotebookHash(),
    previous_comment_id: "pre_edit_id",
    previous_file_hash: "pre_edit_hash",
    contents: commentContents,
    author: getUserHandle(),
  };
  let display_data = JSON.parse(JSON.stringify(post_data));
  display_data["datetime"] = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  console.log(display_data);
  /* if not first comment --> append, else replace existing invisible contents */
  if (
    !threadBubble
      .querySelector(".commentContents")
      .innerHTML.includes("undefined")
  ) {
    let tempContainer = document.createElement("div");
    tempContainer.innerHTML = renderCommentContainer(display_data, true);
    commentContainer = tempContainer.firstElementChild;
    threadBubble.insertBefore(commentContainer, threadBubble.lastElementChild);
  } else {
    let contentsDiv = threadBubble.querySelector(".commentContents");
    contentsDiv.innerHTML = commentContents;
    contentsDiv.style.display = "flex";
  }

  selectedBubble.querySelector(".commentInputContainer").style.display = "none";

  csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  fetch("/submit_comment/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(post_data),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Successfully submitted comment :)");
      } else {
        console.error("Failed to submit comment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function resolveThread(element) {
  let bubbleElement = element.closest(".commentThreadBubble");
  post_data = {
    thread_id: bubbleElement.dataset["threadId"],
    file_hash: getNotebookHash(),
  };
  csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  fetch("/comments/thread/resolve/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(post_data),
  })
    .then((response) => {
      bubbleElement.classList.toggle("commentThreadBubbleHidden");
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
}

/* On Load */

/* main */
let annotationDiv = document.getElementById("annotationCol");
var cellOrders = getCellPrecedence();

var tmp;
/* Load in Threads/Comments */
fetch("../comments/get/" + getNotebookHash() + "/", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.status);
    }
    return response.json();
  })
  .then((data) => {
    var comments = data["comments"];
    comments.forEach((element) => {
      /* Map Dictionary Keys */
      element["statusIcon"] = "NULL";
      element["cellHash"] = element["cell_hash"];
      element["lineNo"] = element["line_no"];
      element["threadId"] = element["thread_id"];
      element["author"] = element["author"];
      element["datetime"] = dtToLocal(element["created_at"]);

      return element;
    });

    let threads = comments.reduce((acc, comment) => {
      const threadId = comment["thread_id"];
      if (!acc[threadId]) {
        acc[threadId] = [];
      }
      acc[threadId].push(comment);

      return acc;
    }, {});

    /* Render All Threads */
    Object.values(threads).forEach((commentGroup) => {
      renderCommentThread(commentGroup);
    });

    /* Make All Threads Selectable */
    Object.keys(threads).forEach((threadId) => {
      $(`#${String(threadId)}`).on("click", "*", handleThreadClick);
    });
  })
  .then((tmp) => {
    sortComments();
  })
  .catch((error) => {
    console.error("Error:", error);
  });

let selectedBubble = null;
var commentableElements = document.getElementsByClassName("new-comment-thread");

deselectElements = document.querySelectorAll(":not(.new-comment-thread)");
deselectElements.forEach(function (element) {
  element.addEventListener("click", resetBubblePosition, false);
});
