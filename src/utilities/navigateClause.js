import * as R from 'ramda';

import store from '../store';
import { min } from 'moment-mini';

/**
 * Functions for navigating the PARSE ERRORS
 * This main function relies upon helper functions
 * The main function is passed to the ErrorLogger
 * Model Errors will come later
 */

/**
 * Returns the contractState.slateValue from the current Redux store
 */
const slateSelector = store => R.path(['contractState', 'slateValue'], store);

/**
 * Returns the clauseId value from the given clause
 */
const clauseIdSelector = clause => R.path(['clauseId'], clause);

/* eslint no-console: 0 */
const noClauseError = () => console.error('Error: clause not found');

/**
 * Takes in a clause ID, takes the SlateValue from the Redux Store
 * Iterates through to find the corresponding clause with the same ID
 * Returns this node
 */
const findClauseNode = (clauseId) => {
  let clauseNode = null;
  const slateValue = slateSelector(store.getState());
  slateValue.document.nodes.forEach((node) => {
    if (node.type !== 'clause') return;
    if ((node.data.get('attributes').clauseid) === clauseId) {
      clauseNode = node.data.get('attributes').clauseid;
    }
  });
  return clauseNode;
};

/**
 * Takes in a clause node to determine a key
 * Using the the Slate key for non clauses
 * Using the clauseId for clauses
 * Scrolls the document to the selected DOM element
 */
const getScrollParent = (node) => {
  const isElement = node instanceof HTMLElement;
  const overflowY = isElement && window.getComputedStyle(node).overflowY;
  const isScrollable = !(overflowY.includes('hidden') || overflowY.includes('visible'));

  if (!node) {
    return null;
  } else if (isScrollable && node.scrollHeight >= node.clientHeight) {
    return node;
  }

  return getScrollParent(node.parentNode) || document.body;
}

let animationFrame;

const scrollTo = (element, value) => {
  console.log(`${element.scrollTop} ${value}`);
  if(Math.abs(element.scrollTop - value) > 2){
    let oldValue = element.scrollTop;
    if(element.scrollTop < value){
      element.scrollTop += Math.min(40, Math.abs(value-element.scrollTop));
    }else{
      element.scrollTop -= Math.min(40, Math.abs(value-element.scrollTop));
    }
    if(oldValue !== element.scrollTop)
      animationFrame = window.requestAnimationFrame(() => scrollTo(element, value));
  }else{
    element.style.position = 'static';
  }
}

const scrollToClause = (clauseNodeId, type) => {
  const selectedClauseNode = (type === 'clause')
    ? document.getElementById(`${clauseNodeId}`)
    : document.querySelector(`[data-key="${clauseNodeId}"]`);
  const parentClauseElement = getScrollParent(selectedClauseNode);
  const toolbarHeight = document.getElementById('slate-toolbar-wrapper-id').clientHeight;
  if(parentClauseElement){
    parentClauseElement.style.position = 'relative';
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(() => scrollTo(parentClauseElement, selectedClauseNode.offsetTop-toolbarHeight));
  }

};




/**
 * High level function to navigate which will pass to the ErrorLogger
 * Identifies the ID to track the specific node in the Slate DOM
 * Calls to scroll to the node
 */
const navigateToClauseError = (clause) => {
  const clauseId = clauseIdSelector(clause);
  const clauseNode = findClauseNode(clauseId);
  if (!clauseNode) {
    noClauseError();
    return;
  }
  scrollToClause(clauseNode, 'clause');
};

export const navigateToHeader = (clauseNode, type) => {
  scrollToClause(clauseNode, type);
};

export default navigateToClauseError;
