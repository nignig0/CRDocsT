set(DTYPE ${CMAKE_SOURCE_DIR}/src/dtype)
set(ORDER ${DTYPE}/order)

file(GLOB ORDER_INC ${ORDER}/*.cpp ${ORDER}/*.hpp)
file(GLOB DTYPE_INC ${DTYPE}/*.cpp ${DTYPE}/*.hpp)

message(STATUS "ORDER_INC: ${ORDER_INC}")
message(STATUS "DTYPE_INC: ${DTYPE_INC}")

add_executable(backend main.cpp ${ORDER_INC} ${DTYPE_INC})

