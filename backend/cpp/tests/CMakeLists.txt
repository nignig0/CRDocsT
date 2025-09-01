project(tests LANGUAGES CXX)
include(CTest)
include(Catch)
enable_testing()

add_executable(tests fuguelist.cpp)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)
catch_discover_tests(tests)
