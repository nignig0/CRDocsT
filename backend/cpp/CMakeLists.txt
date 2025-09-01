cmake_minimum_required(VERSION 3.20)

project(backend LANGUAGES CXX VERSION 0.1)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Unity Build
set(CMAKE_UNITY_BUILD ON)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_definitions(-DDEBUG)
endif()

set(USE_SYSTEM_LIBS OFF CACHE BOOL "Use system libraries if available")
message(STATUS "Use system libraries: ${USE_SYSTEM_LIBS}")

message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
add_compile_options(-Wall -Wextra -Werror=return-type)
set(CMAKE_CXX_FLAGS_DEBUG "-ggdb -fsanitize=address")

set(CMAKE_CXX_FLAGS_RELEASE
    "-O3 -march=native -fno-ident -ftree-vectorize -ffast-math -ffunction-sections -fdata-sections -Wl,--gc-sections -Wl,-s -flto"
)

set(CMAKE_CXX_FLAGS_PROFILE "-g -pg")
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(INCLUDE ${CMAKE_SOURCE_DIR}/src/include)

if(UNIX)
    #################
    # PkgConfig     #
    #################
    find_package(PkgConfig REQUIRED)
    pkg_search_module(TBB REQUIRED tbb IMPORTED_TARGET)
endif()

#################
# Dependencies  #
#################
if(USE_SYSTEM_LIBS)
    find_package(Catch2 3 REQUIRED)
else()
    include(FetchContent)
    FetchContent_Declare(
        Catch2
        GIT_REPOSITORY https://github.com/catchorg/Catch2.git
        GIT_TAG v3.4.0
    )

    FetchContent_MakeAvailable(Catch2)
endif()

add_subdirectory(src)
add_subdirectory(tests)
