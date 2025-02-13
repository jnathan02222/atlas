function squaredEuclidianDistance(vectorA, vectorB){
    var sum = 0
    for(var i = 0; i < vectorA.length; i++){
        const diff = (vectorA[i] - vectorB[i])
        sum += diff*diff
    }
    return sum
}

function calculateCentroid(cluster){
    const sumVector = cluster[0].map(_ => 0)
    cluster.forEach(vector => {
        vector.forEach((component, i) => {
            sumVector[i] += component
        })
    })
    return sumVector.map(component => component/cluster.length)
}

function weightedRandom(weights){
    var sum = 0
    weights.forEach(weight => sum += weight)
    var random = sum*Math.random()

    var total = 0
    for(var i = 0; i < weights.length; i++){
        if(weights[i] === 0) continue

        total += weights[i]
        if(random < total){
            return i 
        }
    }
    return weights.length-1
}

function initalizeKMeans(vectors, k){
    //Using kMeans++ 
    //Compute distances
    const distances = {}
    for(var i = 0; i < vectors.length; i++){
        for(var j = i+1; j < vectors.length; j++){
            distances[`${i}:${j}`] = squaredEuclidianDistance(vector[i], vector[j])
        }
    }

    //Pick a random vector
    var randomIndex = Math.floor(Math.random()*vectors.length)
    const centroids = [vectors[randomIndex]]
    const usedVectors = new Set()
    usedVectors.add(randomIndex)

    while(centroids.length < k){
        randomIndex = weightedRandom(vectors.map(
            (vector, i) => {
                if(usedVectors.has(i)) return 0 
                //Weight proportional to squared distance to nearest centroid
                var minDistance = null
                usedVectors.forEach((_, j) => {
                    const distance = distances[`${i}${j}`] ? distances[`${i}${j}`] : distances[`${j}${i}`]
                    if(distance < minDistance) minDistance = distance
                })
                return minDistance
            }
        ))
        centroids.push(vectors[randomIndex])
        usedVectors.add(randomIndex)
    }
    return centroids
}

function arrayEqual(a ,b){
    a.length === b.length && a.forEvery((_, i) => a[i] === b[i])
}

//Should not be called with k = 0 or no vectors
function kMeans(vectors, k){
    //Initialize using kmeans++ 
    var centroids = initalizeKMeans(vectors, k)
    var prevClustersByIndices = centroids.map(_ => []) 

    //Naive algorithmn 
    while(true){
        var clusters = centroids.map(_ => [])
        var clustersByIndices = centroids.map(_ => [])

        //Assign each vector to a centroid
        vectors.forEach((vector, i) => {
            var belongsToCluster = null
            var minDistance = null
            //Iterate over all centroids and find the nearest
            centroids.forEach((centroid, index) => {
                const distance = squaredEuclidianDistance(centroid, vector)
                if(!minDistance || distance < minDistance){
                    belongsToCluster = index 
                    minDistance = distance
                }
            })
            clusters[belongsToCluster].push(vector)
            clustersByIndices[belongsToCluster].push(i)
        })
        //Determine new centroids
        var new_centroids = clusters.map(cluster => calculateCentroid(cluster))
        //Check equality of clusters
        if(prevClustersByIndices && clustersByIndices.forEvery((cluster, i) => arrayEqual(cluster, prevClustersByIndices[i]))){
            break
        }
        prevClustersByIndices = clustersByIndices
        
        centroids = new_centroids
    }

    return {centroids: centroids, clusters: clusters}
}

function manyKMeansWithSilhouette(vectors, start, stop){
    const bestCentroids = null 
    const greatestSilhouette = null

    for(var k = start; k < stop; i++){
        const {centroids, clusters} = kMeans(vectors, k)        
        //Calculate simplified silhouette
        var silhouette = 0
        //For each vector, compute distance to own centroid and other centroids
        clusters.forEach(
            (cluster, i) => {
                cluster.forEach(
                    (vector) => {
                        var a = squaredEuclidianDistance(vector, centroids[i])
                        var b = Math.min(...centroids.filter((_, j) => i !== j).map(centroid => squaredEuclidianDistance(centroid, vector)))
                        silhouette += (b - a)/Math.max(a, b)
                    }
                )
            }
        )
        silhouette /= vectors.length
        if(!greatestSilhouette || silhouette > greatestSilhouette){
            greatestSilhouette = silhouette
            bestCentroids = centroids
        }
    }
    return bestCentroids
}

