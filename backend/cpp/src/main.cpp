#include <chrono>
#include <memory>
#include <print>
#include <string>
#include <thread>
#include <vector>

#include "dtype/FugeList.hpp"
#include "dtype/order/TotalOrder.hpp"
#include "utils/utils.hpp"

using std::println;
using std::string;
using std::thread;

void simulateUser(FugueList<string>& list, const string& word, int delayBase = 100) {
    zu i{};
    for (auto c : word) {
        std::this_thread::sleep_for(std::chrono::milliseconds(randomInt(delayBase, delayBase + 200)));
        list.insert(i, string(1, c));
        println("Insert [{}]: {}", c, list.observe());
        i++;
    }
}

int main() {
    // --- Test 1: Single writer insertion ---
    {
        println("--- Single Writer Insertion ---");
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));
        const string word = "SHADOW WIZARD MONEY GANG";
        simulateUser(list, word, 50);
        println("Final: {}\n", list.observe());
    }

    // --- Test 2: Single writer deletion ---
    {
        println("--- Single Writer Deletion ---");
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));
        const string word = "SHADOW WIZARD MONEY GANG";
        simulateUser(list, word, 30);
        list.remove(1);  // remove 'O'
        println("After delete index 1: {}\n", list.observe());
    }

    // --- Test 3: Multiple writers concurrent insert ---
    {
        println("--- Multiple Writers ---");
        auto sharedOrder = std::make_shared<StringTotalOrder>(randomString());
        auto list1 = FugueList<string>(sharedOrder);
        auto list2 = FugueList<string>(sharedOrder);

        const string w1 = "SHADOW WIZARD MONEY GANG";
        const string w2 = "WE LOVE CASTING SPELLS";

        thread t1([&] { simulateUser(list1, w1, 40); });
        thread t2([&] { simulateUser(list2, w2, 60); });

        t1.join();
        t2.join();

        // Observe both lists — should produce the same sequence when merged logically
        println("List1 observe(): {}", list1.observe());
        println("List2 observe(): {}\n", list2.observe());
    }

    // --- Test 4: Interleaved insert/delete ---
    {
        println("--- Interleaved Insert/Delete ---");
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));
        list.insert(0, "A");
        list.insert(1, "B");
        list.insert(2, "C");
        println("Initial: {}", list.observe());
        list.remove(1);       // delete B
        list.insert(1, "D");  // insert D at same spot
        println("After erase+insert: {}\n", list.observe());
    }

    return 0;
}
