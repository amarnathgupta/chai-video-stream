import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found!");
    }
    const accessToken = user.generateAccessToken();
    user.refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken: user.refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, username, email, password } = req.body;

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  // const coverImageLocalPath = req?.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = null;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName: fullName.trim(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email.toLowerCase(),
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user details like email/username and password from frontend: {identifier, password}
  // validation - not empty
  // check if user exists: username/email: $or: [{username: identifier}, {email: identifier}]
  // check for password: isPasswordCorrect
  // generate access token and refresh token
  // save refresh token in db
  // remove password and refresh token field from response
  // Set cookie with access token or send the access token in response
  // return res

  const { identifier, password } = req.body;
  if ([identifier, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!");
  }
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  res
    .status(200)
    .cookie("accessToken", `Bearer ${accessToken}`, {
      httpOnly: true,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
    })
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: `Bearer ${accessToken}`,
          refreshToken,
        },
        "User logged in successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // get user from req.user
  // check if user exists
  // remove refresh token from db
  // remove cookies from browser
  // return res

  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: null,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    })
    .json(new ApiResponse(200, null, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // access refresh token from cookies or headers(in mobile app)
  // check if refresh token is present
  // check if refresh token is valid
  // check if user.refreshToken === refresh token
  // generate new access token and refresh token
  // save refresh token in db

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized token");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Unauthorized token");
    }
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized token");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    res
      .status(200)
      .cookie("accessToken", `Bearer ${accessToken}`, {
        httpOnly: true,
        secure: true,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json(
        new ApiResponse(
          200,
          {
            accessToken: `Bearer ${accessToken}`,
            refreshToken,
          },
          "Access token refreshed successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
