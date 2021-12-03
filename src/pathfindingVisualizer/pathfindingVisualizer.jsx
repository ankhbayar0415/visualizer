import React, { Component } from "react";
import "./pathfindingVisualizer.css";
import Node from "./Node/node";
import NavBar from "./navbar/navbar";

//Pathfinding Algorithms
import {
  dijkstra,
  getNodesInShortestPathOrderDijkstra,
} from "../algorithm/dijkstra";
import { astar, getNodesInShortestPathOrderAstar } from "../algorithm/astar";
import {
  breadthFirstSearch,
  getNodesInShortestPathOrderBFS,
} from "../algorithm/breadthFirstSearch";
import {
  depthFirstSearch,
  getNodesInShortestPathOrderDFS,
} from "../algorithm/depthFirstSearch";
import { randomWalk } from "../algorithm/randomWalk";
import {
  greedyBFS,
  getNodesInShortestPathOrderGreedyBFS,
} from "../algorithm/greedyBestFirstSearch";
import {
  bidirectionalGreedySearch,
  getNodesInShortestPathOrderBidirectionalGreedySearch,
} from "../algorithm/bidirectionalGreedySearch";

import { randomMaze } from "../algorithm/randomMaze";
import { recursiveDivisionMaze } from "../algorithm/recursiveDivision";
import { verticalMaze } from "../algorithm/verticalMaze";
import { horizontalMaze } from "../algorithm/horizontalMaze";

const initialNum = getInitialNum(window.innerWidth, window.innerHeight);
const initialNumRows = initialNum[0];
const initialNumColumns = initialNum[1];

let  currStartRow = 1;
let  currStartCol = 1;
let  currFinishRow = 10;
let  currFinishCol = 10;

class PathfindingVisualizer extends Component {
  state = {
    grid: [],
    mouseIsPressed: false,
    visualizingAlgorithm: false,
    generatingMaze: false,
    width: window.innerWidth,
    height: window.innerHeight,
    numRows: initialNumRows,
    numColumns: initialNumColumns,
    isStartNode: false,
    isFinishNode: false,
    isWallNode: false,
    currRow: 0,
    currCol: 0,
    speed: 10,
    mazeSpeed: 10,
  };

  updateDimensions = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  updateSpeed = (path, maze) => {
    this.setState({ speed: path, mazeSpeed: maze });
  };

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
    const grid = this.getInitialGrid(this.state.numRows, this.state.numColumns);
    this.setState({ grid });
  }

  getInitialGrid = (numRows, numColumns) => {
    let grid = [];
    for (let row = 0; row < numRows; row++) {
      let currentRow = [];
      for (let col = 0; col < numColumns; col++) {
        currentRow.push(this.createNode(row, col));
      }
      grid.push(currentRow);
    }
    return grid;
  };

  createNode = (row, col) => {
    return {
      row,
      col,
      isStart:
        row === currStartRow && col === currStartRow,
      isFinish:
        row === currFinishRow && col === currFinishCol,
      distance: Infinity,
      totalDistance: Infinity,
      isVisited: false,
      isShortest: false,
      isWall: false,
      previousNode: null,
    };
  };

  handleMouseDown(row, col) {
    if (!this.state.visualizingAlgorithm && !this.state.generatingMaze) {
      if (this.isGridClear()) {
        const nodeClassName = document.getElementById(
          `node-${row}-${col}`
        ).className;
        if (nodeClassName === "node node-start") {
          this.setState({
            mouseIsPressed: true,
            isStartNode: true,
            currRow: row,
            currCol: col,
          });
        } else if (nodeClassName === "node node-finish") {
          this.setState({
            mouseIsPressed: true,
            isFinishNode: true,
            currRow: row,
            currCol: col,
          });
        } else {
          const newGrid = getNewGridWithWalls(this.state.grid, row, col);
          this.setState({
            grid: newGrid,
            mouseIsPressed: true,
            isWallNode: true,
            currRow: row,
            currCol: col,
          });
        }
      } else {
        this.clearGrid();
      }
    }
  }

  isGridClear() {
    for (const row of this.state.grid) {
      for (const node of row) {
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName === "node node-visited" ||
          nodeClassName === "node node-shortest-path"
        ) {
          return false;
        }
      }
    }
    return true;
  }

  handleMouseEnter(row, col) {
    if (!this.state.visualizingAlgorithm && !this.state.generatingMaze) {
      if (this.state.mouseIsPressed) {
        const nodeClassName = document.getElementById(
          `node-${row}-${col}`
        ).className;
        if (this.state.isStartNode) {
          if (
            nodeClassName === "node"
          ) {
            const prevStartNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevStartNode.isStart = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currStartNode = this.state.grid[row][col];
            currStartNode.isStart = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-start";
          }
          currStartRow = row;
          currStartCol = col;
        } else if (this.state.isFinishNode) {
          if (
            nodeClassName === "node"
          ) {
            const prevFinishNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevFinishNode.isFinish = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currFinishNode = this.state.grid[row][col];
            currFinishNode.isFinish = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-finish";
          }
          currFinishRow = row;
          currFinishCol = col;
        } else if (this.state.isWallNode) {
          if (
            nodeClassName !== "node node-finish" &&
            nodeClassName !== "node node-start"
          ) {
            const newGrid = getNewGridWithWalls(this.state.grid, row, col);
            this.setState({ grid: newGrid, mouseIsPressed: true});
          }
        }
      }
    }
  }

  handleMouseUp(row, col) {
    if (!this.state.visualizingAlgorithm && !this.state.generatingMaze) {
      this.setState({ mouseIsPressed: false });
      if (this.state.isStartNode) {
        const isStartNode = !this.state.isStartNode;
        this.setState({ isStartNode, currStartRow: row, currStartCol: col });
      } else if (this.state.isFinishNode) {
        const isFinishNode = !this.state.isFinishNode;
        this.setState({
          isFinishNode,
        });
      }
      this.getInitialGrid();
    }
  }

  clearGrid() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    for (let row = 0; row < this.state.grid.length; row++) {
      for (let col = 0; col < this.state.grid[0].length; col++) {
        if (
          !(
            (row === currStartRow &&
              col === currStartCol) ||
            (row === currFinishRow &&
              col === currFinishCol)
          )
        ) {
          document.getElementById(`node-${row}-${col}`).className = "node";
        }
      }
    }
    const newGrid = this.getInitialGrid(
      this.state.numRows,
      this.state.numColumns
    );
    this.setState({
      grid: newGrid,
      visualizingAlgorithm: false,
      generatingMaze: false,
    });
  }

  clearPath() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    for (let row = 0; row < this.state.grid.length; row++) {
      for (let col = 0; col < this.state.grid[0].length; col++) {
        if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-shortest-path"
        ) {
          document.getElementById(`node-${row}-${col}`).className = "node";
        }
      }
    }
    const newGrid = getGridWithoutPath(this.state.grid);
    this.setState({
      grid: newGrid,
      visualizingAlgorithm: false,
      generatingMaze: false,
    });
  }

  updateNodesForRender = (
    grid,
    nodesInShortestPathOrder,
    visitedNodesInOrder
  ) => {
    let newGrid = grid.slice();
    for (let node of visitedNodesInOrder) {
      if (
        (node.row === currStartRow &&
          node.col === currStartCol) ||
        (node.row === currFinishRow &&
          node.col === currFinishCol)
      )
        continue;
      let newNode = {
        ...node,
        isVisited: true,
      };
      newGrid[node.row][node.col] = newNode;
    }
    for (let node of nodesInShortestPathOrder) {
      if (
        node.row === currFinishRow &&
        node.col === currFinishCol
      ) {
        return newGrid;
      }
      let newNode = {
        ...node,
        isVisited: false,
        isShortest: true,
      };
      newGrid[node.row][node.col] = newNode;
    }
  };

  animateShortestPath = (nodesInShortestPathOrder, visitedNodesInOrder) => {
    if (nodesInShortestPathOrder.length === 1)
      this.setState({ visualizingAlgorithm: false });
    for (let i = 1; i < nodesInShortestPathOrder.length; i++) {
      if (i === nodesInShortestPathOrder.length - 1) {
        setTimeout(() => {
          let newGrid = this.updateNodesForRender(
            this.state.grid,
            nodesInShortestPathOrder,
            visitedNodesInOrder
          );
          this.setState({ grid: newGrid, visualizingAlgorithm: false });
        }, i * (3 * this.state.speed));
        return;
      }
      let node = nodesInShortestPathOrder[i];
      setTimeout(() => {
        //shortest path node
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-shortest-path";
      }, i * (3 * this.state.speed));
    }
  };

  animateAlgorithm = (visitedNodesInOrder, nodesInShortestPathOrder) => {
    let newGrid = this.state.grid.slice();
    for (let row of newGrid) {
      for (let node of row) {
        let newNode = {
          ...node,
          isVisited: false,
        };
        newGrid[node.row][node.col] = newNode;
      }
    }
    this.setState({ grid: newGrid });
    for (let i = 1; i <= visitedNodesInOrder.length; i++) {
      let node = visitedNodesInOrder[i];
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(
            nodesInShortestPathOrder,
            visitedNodesInOrder
          );
        }, i * this.state.speed);
        return;
      }
      setTimeout(() => {
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-visited";
      }, i * this.state.speed);
    }
  };

  animateRandomWalk = (visitedNodesInOrder) => {
    for (let i = 1; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.setState({ visualizingAlgorithm: false });
        }, i * this.state.speed);
        return;
      }
      let node = visitedNodesInOrder[i];
      if (i === visitedNodesInOrder.length - 1) {
        setTimeout(() => {
          //finish node
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-finish-reached";
        }, i * this.state.speed);
        continue;
      }
      setTimeout(() => {
        //visited node
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-visited";
      }, i * this.state.speed);
    }
  };

  animateBidirectionalAlgorithm(
    visitedNodesInOrderStart,
    visitedNodesInOrderFinish,
    nodesInShortestPathOrder,
    isShortedPath
  ) {
    let len = Math.max(
      visitedNodesInOrderStart.length,
      visitedNodesInOrderFinish.length
    );
    for (let i = 1; i <= len; i++) {
      let nodeA = visitedNodesInOrderStart[i];
      let nodeB = visitedNodesInOrderFinish[i];
      if (i === visitedNodesInOrderStart.length) {
        setTimeout(() => {
          let visitedNodesInOrder = getVisitedNodesInOrder(
            visitedNodesInOrderStart,
            visitedNodesInOrderFinish
          );
          if (isShortedPath) {
            this.animateShortestPath(
              nodesInShortestPathOrder,
              visitedNodesInOrder
            );
          } else {
            this.setState({ visualizingAlgorithm: false });
          }
        }, i * this.state.speed);
        return;
      }
      setTimeout(() => {
        //visited nodes
        if (nodeA !== undefined)
          document.getElementById(`node-${nodeA.row}-${nodeA.col}`).className =
            "node node-visited";
        if (nodeB !== undefined)
          document.getElementById(`node-${nodeB.row}-${nodeB.col}`).className =
            "node node-visited";
      }, i * this.state.speed);
    }
  }

  visualizeDijkstra() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode = grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderDijkstra(finishNode);
      this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    }, this.state.speed);
  }

  visualizeAStar() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = astar(grid, startNode, finishNode);
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderAstar(finishNode);
      this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    }, this.state.speed);
  }

  visualizeBFS() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = breadthFirstSearch(
        grid,
        startNode,
        finishNode
      );
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderBFS(finishNode);
      this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    }, this.state.speed);
  }

  visualizeDFS() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = depthFirstSearch(grid, startNode, finishNode);
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderDFS(finishNode);
      this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    }, this.state.speed);
  }

  visualizeRandomWalk() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = randomWalk(grid, startNode, finishNode);
      this.animateRandomWalk(visitedNodesInOrder);
    }, this.state.speed);
  }

  visualizeGreedyBFS() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = greedyBFS(grid, startNode, finishNode);
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderGreedyBFS(finishNode);
      this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    }, this.state.speed);
  }

  visualizeBidirectionalGreedySearch() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ visualizingAlgorithm: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const visitedNodesInOrder = bidirectionalGreedySearch(
        grid,
        startNode,
        finishNode
      );
      const visitedNodesInOrderStart = visitedNodesInOrder[0];
      const visitedNodesInOrderFinish = visitedNodesInOrder[1];
      const isShortedPath = visitedNodesInOrder[2];
      const nodesInShortestPathOrder =
        getNodesInShortestPathOrderBidirectionalGreedySearch(
          visitedNodesInOrderStart[visitedNodesInOrderStart.length - 1],
          visitedNodesInOrderFinish[visitedNodesInOrderFinish.length - 1]
        );
      this.animateBidirectionalAlgorithm(
        visitedNodesInOrderStart,
        visitedNodesInOrderFinish,
        nodesInShortestPathOrder,
        isShortedPath
      );
    }, this.state.speed);
  }

  animateMaze = (walls) => {
    for (let i = 0; i <= walls.length; i++) {
      if (i === walls.length) {
        setTimeout(() => {
          this.clearGrid();
          let newGrid = getNewGridWithMaze(this.state.grid, walls);
          this.setState({ grid: newGrid, generatingMaze: false });
        }, i * this.state.mazeSpeed);
        return;
      }
      let wall = walls[i];
      let node = this.state.grid[wall[0]][wall[1]];
      setTimeout(() => {
        //Walls
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-wall-animated";
      }, i * this.state.mazeSpeed);
    }
  };

  generateRandomMaze() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ generatingMaze: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const walls = randomMaze(grid, startNode, finishNode);
      this.animateMaze(walls);
    }, this.state.mazeSpeed);
  }

  generateRecursiveDivisionMaze() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ generatingMaze: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const walls = recursiveDivisionMaze(grid, startNode, finishNode);
      this.animateMaze(walls);
    }, this.state.mazeSpeed);
  }

  generateVerticalMaze() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ generatingMaze: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const walls = verticalMaze(grid, startNode, finishNode);
      this.animateMaze(walls);
    }, this.state.mazeSpeed);
  }

  generateHorizontalMaze() {
    if (this.state.visualizingAlgorithm || this.state.generatingMaze) {
      return;
    }
    this.setState({ generatingMaze: true });
    setTimeout(() => {
      const { grid } = this.state;
      const startNode = grid[currStartRow][currStartCol];
      const finishNode =
        grid[currFinishRow][currFinishCol];
      const walls = horizontalMaze(grid, startNode, finishNode);
      this.animateMaze(walls);
    }, this.state.mazeSpeed);
  }

  render() {
    let { grid } = this.state;
    return (
      <React.Fragment>
        <NavBar
          visualizingAlgorithm={this.state.visualizingAlgorithm}
          generatingMaze={this.state.generatingMaze}
          visualizeDijkstra={this.visualizeDijkstra.bind(this)}
          visualizeAStar={this.visualizeAStar.bind(this)}
          visualizeGreedyBFS={this.visualizeGreedyBFS.bind(this)}
          visualizeBidirectionalGreedySearch={this.visualizeBidirectionalGreedySearch.bind(
            this
          )}
          visualizeBFS={this.visualizeBFS.bind(this)}
          visualizeDFS={this.visualizeDFS.bind(this)}
          visualizeRandomWalk={this.visualizeRandomWalk.bind(this)}
          generateRandomMaze={this.generateRandomMaze.bind(this)}
          generateRecursiveDivisionMaze={this.generateRecursiveDivisionMaze.bind(
            this
          )}
          generateVerticalMaze={this.generateVerticalMaze.bind(this)}
          generateHorizontalMaze={this.generateHorizontalMaze.bind(this)}
          clearGrid={this.clearGrid.bind(this)}
          clearPath={this.clearPath.bind(this)}
          updateSpeed={this.updateSpeed.bind(this)}
        />
        <div
          className={
            this.state.visualizingAlgorithm || this.state.generatingMaze
              ? "grid-visualizing"
              : "grid"
          }
        >
          {grid.map((row, rowId) => {
            return (
              <div key={rowId}>
                {row.map((node, nodeId) => {
                  const {
                    row,
                    col,
                    isStart,
                    isFinish,
                    isVisited,
                    isShortest,
                    isWall,
                  } = node;
                  return (
                    <Node
                      key={nodeId}
                      row={row}
                      col={col}
                      isStart={isStart}
                      isFinish={isFinish}
                      isVisited={isVisited}
                      isShortest={isShortest}
                      isWall={isWall}
                      onMouseDown={(row, col) => this.handleMouseDown(row, col)}
                      onMouseEnter={(row, col) =>
                        this.handleMouseEnter(row, col)
                      }
                      onMouseUp={() => this.handleMouseUp()}
                      width={this.state.width}
                      height={this.state.height}
                      numRows={this.state.numRows}
                      numColumns={this.state.numColumns}
                    ></Node>
                  );
                })}
              </div>
            );
          })}
        </div>
      </React.Fragment>
    );
  }
}

function getInitialNum(width, height) {
  let numColumns;
  if (width > 1500) {
    numColumns = Math.floor(width / 25);
  } else if (width > 1250) {
    numColumns = Math.floor(width / 22.5);
  } else if (width > 1000) {
    numColumns = Math.floor(width / 20);
  } else if (width > 750) {
    numColumns = Math.floor(width / 17.5);
  } else if (width > 500) {
    numColumns = Math.floor(width / 15);
  } else if (width > 250) {
    numColumns = Math.floor(width / 12.5);
  } else if (width > 0) {
    numColumns = Math.floor(width / 10);
  }
  let cellWidth = Math.floor(width / numColumns);
  let numRows = Math.floor(height / cellWidth);
  return [numRows, numColumns];
}

const getNewGridWithWalls = (grid, row, col) => {
  let newGrid = grid.slice();
  let node = grid[row][col];
  let newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};

const getNewGridWithMaze = (grid, walls) => {
  let newGrid = grid.slice();
  for (let wall of walls) {
    let node = grid[wall[0]][wall[1]];
    let newNode = {
      ...node,
      isWall: true,
    };
    newGrid[wall[0]][wall[1]] = newNode;
  }
  return newGrid;
};

const getGridWithoutPath = (grid) => {
  let newGrid = grid.slice();
  for (let row of grid) {
    for (let node of row) {
      let newNode = {
        ...node,
        distance: Infinity,
        totalDistance: Infinity,
        isVisited: false,
        isShortest: false,
        previousNode: null,
      };
      newGrid[node.row][node.col] = newNode;
    }
  }
  return newGrid;
};

const getVisitedNodesInOrder = (
  visitedNodesInOrderStart,
  visitedNodesInOrderFinish
) => {
  let visitedNodesInOrder = [];
  let n = Math.max(
    visitedNodesInOrderStart.length,
    visitedNodesInOrderFinish.length
  );
  for (let i = 0; i < n; i++) {
    if (visitedNodesInOrderStart[i] !== undefined) {
      visitedNodesInOrder.push(visitedNodesInOrderStart[i]);
    }
    if (visitedNodesInOrderFinish[i] !== undefined) {
      visitedNodesInOrder.push(visitedNodesInOrderFinish[i]);
    }
  }
  return visitedNodesInOrder;
};

export default PathfindingVisualizer;