function isIterable(obj) {
  // Check if the object has a Symbol.iterator property or method
  return obj != null && typeof obj[Symbol.iterator] === "function";
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
    selectedBubble = null;
  }
}

function toggleBubbleCode(threadId, on = true) {
  let threadBubble = document.getElementById(threadId);
  let threadCodeId = `code-${threadBubble.dataset["cellHash"]}-${threadBubble.dataset["lineNo"]}`;
  let threadCodeElement = document.getElementById(threadCodeId);

  if (document.getElementById(threadCodeId) === undefined) {
    return;
  } else {
    threadCodeTextDiv = threadCodeElement.querySelector("pre");
    threadCodeTextDiv.style.flex = "auto";

    if (on) {
      threadCodeTextDiv.className = "codeHighlight";
    } else {
      threadCodeTextDiv.className = "null";
    }
  }
}

function handleThreadClick(event) {
  resetBubblePosition(event);
  let bubbleElement = event.target.closest(".commentThreadBubble");
  selectedBubble = bubbleElement; // change selected bubble

  selectedBubble.style.transform = "scale(1.1)";
  selectedBubble.style.marginLeft = "-10px";
  selectedBubble.style.boxShadow =
    "0 1px 3px rgba(0, 0, 0, .3), 0 4px 8px 3px rgba(0, 0, 0, .15)";

  /* Show input on Bubble Selection */
  let commentContainer = selectedBubble.querySelector(".commentInputContainer");
  commentContainer.style.display = "flex";
  toggleBubbleCode(selectedBubble.id, (on = true));

  if (event.target != this) {
    console.log("DEBUG:You clicked a descendant of #container.");
  } else {
    console.log("DEBUG:You actually clicked #container itself.");
  }
}

function renderCommentContainer(data, newThread = false) {
  var blockStyle;
  if (newThread) {
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
                @${data.handle} (${data.fullName})
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

function renderCommentThread(data, newThread = false) {
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
        ${firstObject.statusIcon}
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
            ${firstObject.statusIcon}
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
  <div class='flex-container commentInputContainer' style="display:${commentInputStyle};"> 
    <textarea type="text" id="input-${firstObject.thread_id}" class="commentInput" placeholder="Commenting as ..."></textarea><br><br>
    <div class="flex-child textInputButtons">
        <button class="flex-child pill-button submitButton" onclick="submitComment(this);event.stopPropagation()">Submit</button>
        <button class="flex-child pill-button"">Cancel</button>
    </div>
  </div>
  `;
  var div = document.createElement("div");
  div.innerHTML = htmlTemplate + commentBox;
  div.id = firstObject.thread_id;
  div.classList.add("flex-container", "commentThreadBubble");

  div.setAttribute("data-thread-id", `${firstObject.thread_id}`);
  div.setAttribute("data-cell-hash", `${firstObject.cell_hash}`);
  div.setAttribute("data-line-no", `${firstObject.line_no}`);

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
    return;
  } else {
    if (lineNo === undefined) {
      lineNo = "outputs";
    }

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
      handle: "employeeHandle",
      fullName: "Full Name",
      datetime: formattedDate,
      comment: "Placeholder",
    };
    renderCommentThread(data, true);
    selectedBubble = document.getElementById(threadId);
  }
}

function closeThread(element) {
  let threadBubble = element.closest(".commentThreadBubble");
  let commentInput = threadBubble.closest(".commentInput");
}

function submitComment(element) {
  /** 
        Gather Data
    **/
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
    author: "SAML_author",
    assigned: false,
    resolved: false,
  };

  /* if not first comment --> append */
  if (threadBubble.querySelectorAll(".commentContainer").length > 1) {
    let tempContainer = document.createElement("div");
    tempContainer.innerHTML = renderCommentContainer(post_data);
    commentContainer = tempContainer.firstElementChild;
    threadBubble.insertBefore(commentContainer, threadBubble.lastElementChild);
  } else {
    let contentsDiv = threadBubble.querySelector(".commentContents");
    contentsDiv.innerHTML = commentContents;
    contentsDiv.style.display = "flex";
  }

  selectedBubble.querySelector(".commentInputContainer").style.display = "none";

  fetch("/submit_comment/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

/* On Load */

/* main */
let annotationDiv = document.getElementsByClassName("annotationCol")[0];
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
      element["handle"] = element["author"];
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
  .catch((error) => {
    console.error("Error:", error);
  });

let selectedBubble = null;
var commentableElements = document.getElementsByClassName("new-comment-thread");

deselectElements = document.querySelectorAll(":not(.new-comment-thread)");
deselectElements.forEach(function (element) {
  element.addEventListener("click", resetBubblePosition, false);
});
