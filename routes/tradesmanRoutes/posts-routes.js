const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { EmployeeModel, PostsModel } = require("../../Functions/databaseSchema");
const multer = require("multer");
const upload = multer();
const { generateToken, verifyToken } = require("../../Functions/middleware/authorisation");
const { s3Retrieve, s3Upload, s3Delete, getCoordinates } = require("../../Functions/general_functions")
const { SupportApp } = require("aws-sdk");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());

// Endpoint used to add new posts to the logged-in user
app.post("/", verifyToken, upload.any(), async (req, res) => {
    try {
        const { title } = req.body || "";
        const date = new Date();
        const createdAt = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} @ ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        const time = createdAt.split(" ")[0]

        const TradesmanId = req.user.id

        const exists = await EmployeeModel.findById(TradesmanId);

        if (!exists) {
            return res.status(404).json({ response: "Tradesman's id could not be found" });
        }

        // Assuming you want to upload the first file in the req.files array
        if (req.files.length === 0) {
            return res.status(400).json({ response: "No files uploaded" });
        }

        const session = await mongoose.startSession()
        try {
            session.startTransaction();
            // Save post to database
            await EmployeeModel.findByIdAndUpdate(TradesmanId, {
                $push: {
                    posts: {
                        title,
                        createdAt,
                        videoName: `${TradesmanId}@${time}${req.files[0].originalname}`,
                        TradesmanId
                    }
                }
            });
            const newPost = new PostsModel({
                title: title,
                createdAt: createdAt,
                videoName: `${TradesmanId}@${time}${req.files[0].originalname}`,
                tradesmansId: `${TradesmanId}`

            })
            await newPost.save()
            await s3Upload(req.files[0], time, TradesmanId);
            await session.commitTransaction();

        }
        catch (err) {
            await session.abortTransaction();
            return res.status(400).json({ "Error": err })
        }

        finally {
            session.endSession();
        }

        res.status(200).json({ response: "Successfully posted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ response: "Internal Server Error" });
    }
});

app.get("/", verifyToken, async (req, res) => {
    try {
        const TradesmanId = req.user.id
        const exists = await EmployeeModel.findById(TradesmanId);
        const posts = exists.posts

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].videoName != null) {
                posts[i].videoName = await s3Retrieve(posts[i].videoName)
            }
        }
        return res.status(200).json({ videos: posts })

    }
    catch (err) {
        console.log(err)
    }
})

//this gets posts of other trademsmans.
app.get("/allPosts", verifyToken, async (req, res) => {
    try {
        //extract the id of the tradesmans
        const user_id = req.user.id
        //get all posts from the post table
        const allPost = await PostsModel.find({})
        //filter the post by tradesmans id != current tradesman
        const filteredPosts = []
        for (let i = 0; i < allPost.length; i++) {
            // if (allPost[i].tradesmansId != user_id) {
            allPost[i].videoName = (allPost[i].videoName != null ? await s3Retrieve(allPost[i].videoName) : null)
            filteredPosts.push(allPost[i])
            // }

        }
        //return the filtered posts
        return res.status(200).json({ data: filteredPosts })
    }
    catch (err) {
        //display error if an error is caught
        return res.status(400).json({ error: errallPosts })
    }
})



app.delete("/delete/:postId", verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const post_Id = req.params.postId;
        const tradesmansId = req.user.id;
        const exists = await EmployeeModel.findById(tradesmansId).session(session);

        if (exists) {
            let posts = exists.posts;
            let postFound = false;

            for (let i = 0; i < posts.length; i++) {
                if (posts[i].id == post_Id) {
                    postFound = true;
                    const videoName = posts[i].videoName;

                    // Delete the post from PostsModel
                    await PostsModel.findOneAndDelete({ videoName: videoName }).session(session);

                    // Delete the video from S3
                    await s3Delete(posts[i].videoName);

                    // Remove the post from the EmployeeModel's posts array
                    posts.splice(i, 1);
                    exists.posts = posts;

                    // Save the updated EmployeeModel
                    await exists.save({ session });

                    // Commit the transaction
                    await session.commitTransaction();
                    session.endSession();

                    return res.status(200).json({ response: "Post deleted successfully" });
                }
            }

            if (!postFound) {
                await session.abortTransaction();
                session.endSession();
                return res.status(204).json({ response: "Post not found" });
            }
        } else {
            await session.abortTransaction();
            session.endSession();
            return res.status(204).json({ Error: "Tradesman not found" });
        }
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ Error: err.message });
    }
});



module.exports = app;
