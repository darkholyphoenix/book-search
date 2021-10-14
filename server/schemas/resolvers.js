const { User, Book} = require('../models');
const { AuthenticationError} = require('apollo-server-express');
const {signToken} = require('../utils/auth');
const { __InputValue } = require('graphql');

const resolvers = {
    Query: {
        //get a user 
        me: async (parent,args,context) => {
            if(context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password')
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        }
    },
    Mutation:{
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            
            return { token, user};
        },
        login: async( parent, {email, password})=> {
            const user = await User.findOne({email});
            if(!user){
                throw new AuthenticationError('Incorrect credentials')
            }
            const correctPW = await user.isCorrectPassword(password);
            if(!correctPW){
                throw new AuthenticationError('Incorrect Password');
            }
            const token = signToken(user);
            return {token, user};
        },
        saveBook: async (parent, { input }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: {savedBooks: input} },
                    { new: true } 
                ).populate("savedBook")
                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!')
        },
        removeBook: async (parent, {bookId}, context) => {
            if(context.user){
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id},
                    {$pull: {savedBooks: {bookId:bookId}}},
                    {new: true}
                )
                return updatedUser;
            }
        }
    }
};

module.exports = resolvers;