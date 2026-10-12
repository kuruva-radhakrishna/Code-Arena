require('dotenv').config();
const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    problemName : {
        type : String,
        required : true,
        unique : true,
    },
    CreatedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref  : 'User',
        required : true,
    },
    CreatedAt : {
        type : Date,
        default : Date.now
    },
    problemDescription : {
        type : String,
        required : true,
    },
    Constraints : [
        {
            type : String
        }
    ],
    TestCases : [
        {
            input : {
                type : String,
            },
            output : {
                type : String,
            },
            isPublic : {
                type : Boolean,
                default : true,
            }
        }
    ],
    difficulty : {
        type : String ,
        enum : ["easy","medium","hard"],
        default : "medium"
    },
    topics : [
        {
            type : String,
            enum: [
                "array",
                "string",
                "hash table",
                "dynamic programming",
                "math",
                "sorting",
                "greedy",
                "tree",
                "graph",
                "binary search",
                "recursion",
                "backtracking",
                "stack",
                "queue",
                "heap",
                "linked list",
                "sliding window",
                "two pointers",
                "bit manipulation",
                "number theory",
                "geometry",
                "database",
                "shell",
                "javascript",
                "concurrency",
                "depth-first search",
                "breadth-first search",
                "trie",
                "segment tree",
                "disjoint set",
                "topological sort",
                "shortest path",
                "minimum spanning tree",
                "game theory",
                "probability",
                "combinatorics",
                "implementation",
                "prefix sum",
                "hashing",
                "simulation",
                "other"
            ]
        }
    ],
    hints : [
        {
            type : String
        }

    ],
    Discussions : [
        {
            user : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User',
            },
            comment : {
                type : String,
                required : true,
            },
            likes : {
                type : Number,
                default : 0,
            },
            dislikes : {
                type : Number,
                default : 0
            }
        }
    ],
    likes : {
        type : Number,
        default : 0,
    },
    dislikes : {
        type : Number,
        default : 0
    }
});


module.exports = mongoose.model("Problem",ProblemSchema);