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

function initalizeKMeans(vectors, k){
    return []
}

//Should not be called with k = 0 or no vectors
function kMeans(vectors, k){
    //Initialize using kmeans++ 
    var centroids = initalizeKMeans(vectors, k)

    //Naive algorithmn 
    while(true){
        var clusters = centroids.map(_ => [])
        //Assign each vector to a centroid
        vectors.forEach(vector => {
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
        })
        //Determine new centroids
        var new_centroids = clusters.map(cluster => calculateCentroid(cluster))
        //Check equality
        if(centroids === new_centroids){
            return centroids
        }
        centroids = new_centroids
    }
}

function manyKMeansWithSilhouette(vectors, start, stop){
    
}

