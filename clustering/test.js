
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const fs = require("fs");
const {calculateCentroid, initalizeKMeans, kMeans, manyKMeansWithSilhouette} = require("./cluster")

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width : 800, height : 800 });

function generateCluster({x, y}, r, n){
  return Array(n).fill().map((_, i) => {
    const randomX = (Math.random()-0.5)*2*r 
    const randomY = (Math.random()-0.5)*2*Math.sqrt(r*r - randomX*randomX)
    return Math.random() > 0.5 ? {x: x+randomX, y : y+randomY} : {x : x+randomY, y: y+randomX} 
  })
}

async function generateScatterPlot(){
  const clusterA = generateCluster({x: 0, y: 0}, 8, 500)
  const clusterB = generateCluster({x: -10, y: -16}, 8, 500)
  const clusterC = generateCluster({x: 10, y: -16}, 8, 500)

  const fullCluster = [...clusterA, ...clusterB, ...clusterC]
  const {centroids, clusters} = kMeans(fullCluster.map(point => [point.x, point.y]), 3)
  console.log(centroids)
  console.log(manyKMeansWithSilhouette(fullCluster.map(point => [point.x, point.y]), 1, 10))

  function getCentroid(cluster){
    return calculateCentroid(cluster.map(point => [point.x, point.y]))
  }

  const configuration = {
    type: "scatter",
    data: {
      datasets: [
        /*{
          label: "Cluster",
          data: fullCluster,
          backgroundColor: "rgba(255, 0, 0, 0.1)",
        },
        {
          label: "Centroids",
          data: [getCentroid(clusterA), getCentroid(clusterB), getCentroid(clusterC), getCentroid(fullCluster)],
          backgroundColor: "rgba(0, 255, 0, 0.1)",
        },
        {
          label: "Seed",
          data: initalizeKMeans(fullCluster.map(point => [point.x, point.y]), 3),
          backgroundColor: "rgba(0, 0, 255, 0.7)",
        },*/
        {
          label: "CentroidA",
          data: [centroids[0]],
          backgroundColor: "rgba(255, 0, 255, 1)",
        },
        {
          label: "CentroidB",
          data: [centroids[1]],
          backgroundColor: "rgba(0, 255, 255, 1)",
        },
        {
          label: "CentroidC",
          data: [centroids[2]],
          backgroundColor: "rgba(255, 255, 0, 1)",
        },
        {
          label: "ClusterA",
          data: clusters[0],
          backgroundColor: "rgba(255, 0, 255, 0.1)",
        },
        {
          label: "ClusterB",
          data: clusters[1],
          backgroundColor: "rgba(0, 255, 255, 0.1)",
        },
        {
          label: "ClusterC",
          data: clusters[2],
          backgroundColor: "rgba(255, 255, 0, 0.1)",
        }
      ],
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration)
  fs.writeFileSync("scatter-plot.png", imageBuffer)
};

generateScatterPlot();