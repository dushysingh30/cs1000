import Head from "next/head";
// import { URL } from "../common";
import Lecturers from "../components/Lecturers";
import About from "../components/About";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Semesters from "../components/Semesters";
import React, { useRef, useEffect, useState } from "react";

export default function Home({ data, token }) {
  const appBody = useRef(null);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
    return () => {
      playWithDom();
    };
  }, [loading]);
  const playWithDom = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    domChanges(doc);
    appBody.current.addEventListener("click", (e) => {
      semesterClick(e);
    });
  };
  const semesterClick = (e) => {
    const node = e.target.nodeName;
    if (node === "H3" || node === "STRONG") {
      let parent =
        node === "H3"
          ? e.target
          : node === "STRONG"
          ? e.target.parentElement
          : false;
      parent.querySelector(".ml-3").textContent =
        parent.querySelector(".ml-3").textContent === "+" ? "-" : "+";
      let loop = true;
      let siblings = [];
      let nextSibling =
        node === "STRONG"
          ? e.target.parentElement.parentElement.parentElement
              .nextElementSibling
          : e.target.parentElement.parentElement.nextElementSibling;
      while (loop) {
        siblings.push(nextSibling);
        if (nextSibling === null) {
          loop = false;
        } else if (nextSibling.nextElementSibling === null) {
          loop = false;
        } else {
          nextSibling = nextSibling.nextElementSibling;
          if (
            nextSibling.nodeName === "OL" &&
            nextSibling.getAttribute("start")
          ) {
            loop = false;
          }
        }
      }
      siblings.forEach((i) => {
        // foo
        i.classList.toggle("d-none");
      });
    }
  };
  const domChanges = (doc) => {
    Array.from(doc.querySelectorAll("ol li h3 strong")).forEach((i) => {
      const tempDiv = document.createElement("div");
      tempDiv.classList.add("ml-3");
      tempDiv.textContent = "+";
      i.insertAdjacentElement("afterend", tempDiv);
      i.parentElement.classList.add(
        "d-flex",
        "align-items-center",
        "justify-content-between"
      );
    });
    Array.from(doc.querySelectorAll("a")).forEach((i) => {
      i.setAttribute("rel", "noopener noreferrer");
      if (i.getAttribute("href") && i.getAttribute("href") !== "#") {
        i.setAttribute(
          "href",
          `${i
            .getAttribute("href")
            .replace("http://web.archive.org/web/20210210143025/", "")}`
        );
        i.setAttribute("target", "_blank");
      }
    });
    Array.from(doc.querySelectorAll("h2")).forEach((i) => {
      const text = i.textContent;
      const isTextValid = !(
        i.textContent.includes("Conc") || i.textContent.includes("Whol")
      );
      if (isTextValid) {
        let loop = true;
        let siblings = [];
        let nextSibling = i.nextElementSibling;
        let youTube;
        while (loop) {
          if (
            nextSibling.nodeName === "DIV" &&
            nextSibling.className === "youtube-responsive-container"
          ) {
            youTube =
              nextSibling.querySelector("iframe").getAttribute("data-ezsrc") ||
              nextSibling.querySelector("iframe").getAttribute("src");
            youTube = youTube.replace(
              "http://web.archive.org/web/20210210143025if_/",
              ""
            );
            const hyperlink = document.createElement("a");
            hyperlink.setAttribute("href", youTube);
            hyperlink.setAttribute("target", "_blank");
            hyperlink.setAttribute("rel", "noopener noreferrer");
            hyperlink.textContent = "Reference lecture on this topic";
            hyperlink.classList.add("d-none", "youtube");
            siblings.push(hyperlink);
          } else {
            if (
              nextSibling.nodeName !== "DIV" &&
              nextSibling.innerHTML !== "" &&
              nextSibling.innerHTML !== "&nbsp;" &&
              !nextSibling.innerHTML.includes(" -->&nbsp;") &&
              !nextSibling.innerHTML.includes("</span>&nbsp;")
            ) {
              if (
                nextSibling.nodeName === "P" ||
                nextSibling.nodeName === "UL" ||
                (nextSibling.nodeName === "OL" &&
                  nextSibling.querySelector("h3") === null)
              ) {
                nextSibling.classList.add("d-none");
              }
              siblings.push(nextSibling);
            }
          }
          nextSibling = nextSibling.nextElementSibling;
          if (nextSibling.nodeName === "H2") {
            loop = false;
          }
        }
        siblings = siblings
          .map((i) => {
            if (i.outerHTML !== "<p></p>" && i.outerHTML !== "<p>&nbsp;</p>") {
              return i.outerHTML;
            }
          })
          .join("");
        setResult((prevResult) => {
          return prevResult.concat({
            title: text.replace(/.*:\s/, ""),
            siblings,
          });
        });
      }
    });
  };
  return (
    <div className="p-3 min-vh-100">
      <Head>
        <title>CS1000</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header token={token} />
      <Semesters appBody={appBody} result={result} />
      <Lecturers />
      <About />
      <Footer />
    </div>
  );
}

Home.getInitialProps = async () => {
  const URLAPI = `https://web.archive.org/__wb/calendarcaptures/2?url=https://laconicml.com/computer-science-curriculum-youtube-videos/&date=${new Date().getFullYear()}`;
  const getTimeMachineAPIResponse = await fetch(URLAPI);
  const newURL = (latestTimeMachineSnapshot) =>
    `https://web.archive.org/web/${latestTimeMachineSnapshot}/https://laconicml.com/computer-science-curriculum-youtube-videos/`;
  const { items } = await getTimeMachineAPIResponse.json();
  const latestTimeMachineSnapshotId = items[items.length - 1][0];
  const r = await fetch(newURL(latestTimeMachineSnapshotId));
  const j = await r.text();
  return {
    data: j,
    token: latestTimeMachineSnapshotId,
  };
};
